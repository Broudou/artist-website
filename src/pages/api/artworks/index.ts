import type { APIRoute } from 'astro';
import slugify from 'slugify';
import { connectDB } from '../../../lib/db';
import { Artwork } from '../../../lib/models/Artwork';
import { processImage } from '../../../lib/imageProcessor';

// Auth is enforced by src/middleware.ts for all /api/artworks/** routes.

export const GET: APIRoute = async () => {
  await connectDB();
  const artworks = await Artwork.find().sort({ createdAt: -1 }).lean();

  return new Response(JSON.stringify(artworks), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const formData = await request.formData();

    const imageFile = formData.get('image') as File | null;
    if (!imageFile || imageFile.size === 0) {
      return new Response(JSON.stringify({ error: 'Image is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const buffer = Buffer.from(await imageFile.arrayBuffer());
    const { imageUrl, thumbnailUrl } = await processImage(buffer, imageFile.type);

    const title = formData.get('title') as string;
    let slug = slugify(title, { lower: true, strict: true });

    await connectDB();

    const existing = await Artwork.findOne({ slug });
    if (existing) slug = `${slug}-${Date.now()}`;

    const printSizesRaw = formData.get('printSizes') as string;
    let printSizes = [];
    try {
      printSizes = printSizesRaw ? JSON.parse(printSizesRaw) : [];
    } catch {
      printSizes = [];
    }

    const tagsRaw = formData.get('tags') as string;
    const tags = tagsRaw
      ? tagsRaw.split(',').map((t) => t.trim()).filter(Boolean)
      : [];

    const priceRaw = formData.get('price') as string;
    const price = priceRaw && priceRaw !== '' ? parseFloat(priceRaw) : null;

    const artwork = await Artwork.create({
      title,
      slug,
      description: formData.get('description') as string,
      category: formData.get('category') as string,
      medium: formData.get('medium') as string,
      year: parseInt(formData.get('year') as string) || new Date().getFullYear(),
      imageUrl,
      thumbnailUrl,
      price,
      printSizes,
      available: formData.get('available') === 'on',
      featured: formData.get('featured') === 'on',
      tags,
    });

    // Form submission: redirect back to admin list
    const isFormSubmit = request.headers.get('content-type')?.includes('multipart/form-data');
    if (isFormSubmit) {
      return new Response(null, {
        status: 302,
        headers: { Location: `/admin/artworks/${artwork._id}?success=1` },
      });
    }

    return new Response(JSON.stringify(artwork), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Create artwork error:', err);
    return new Response(JSON.stringify({ error: 'Server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
