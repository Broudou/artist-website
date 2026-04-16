import type { APIRoute } from 'astro';
import { connectDB } from '../../../lib/db';
import { Artwork } from '../../../lib/models/Artwork';
import { processImage, deleteImages } from '../../../lib/imageProcessor';

// Auth is enforced by src/middleware.ts for all /api/artworks/** routes.

// Handle HTML form method override (forms can only POST/GET).
export const POST: APIRoute = async (ctx) => {
  const { params } = ctx;
  const formData = await ctx.request.clone().formData();
  const method = formData.get('_method') as string;

  if (method === 'DELETE') {
    const res = await DELETE(ctx);
    if (res.ok) return new Response(null, { status: 302, headers: { Location: '/admin/artworks' } });
    return new Response(null, { status: 302, headers: { Location: `/admin/artworks/${params.id}?error=1` } });
  }

  const res = await PUT(ctx);
  if (res.ok) {
    return new Response(null, { status: 302, headers: { Location: `/admin/artworks/${params.id}?success=1` } });
  }
  return new Response(null, { status: 302, headers: { Location: `/admin/artworks/${params.id}?error=1` } });
};

export const PUT: APIRoute = async ({ request, params }) => {
  try {
    await connectDB();
    const artwork = await Artwork.findById(params.id);
    if (!artwork) {
      return new Response(JSON.stringify({ error: 'Not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const formData = await request.formData();

    const imageFile = formData.get('image') as File | null;
    if (imageFile && imageFile.size > 0) {
      await deleteImages(artwork.imageUrl, artwork.thumbnailUrl);
      const buffer = Buffer.from(await imageFile.arrayBuffer());
      const { imageUrl, thumbnailUrl } = await processImage(buffer, imageFile.type);
      artwork.imageUrl = imageUrl;
      artwork.thumbnailUrl = thumbnailUrl;
    }

    const title = formData.get('title') as string;
    if (title) artwork.title = title;

    const description = formData.get('description') as string;
    if (description !== null) artwork.description = description;

    const category = formData.get('category') as 'drawing' | 'photo';
    if (category) artwork.category = category;

    const medium = formData.get('medium') as string;
    if (medium !== null) artwork.medium = medium;

    const yearRaw = formData.get('year') as string;
    if (yearRaw) artwork.year = parseInt(yearRaw);

    const priceRaw = formData.get('price') as string;
    artwork.price = priceRaw && priceRaw !== '' ? parseFloat(priceRaw) : null;

    const printSizesRaw = formData.get('printSizes') as string;
    try {
      artwork.printSizes = printSizesRaw ? JSON.parse(printSizesRaw) : [];
    } catch {
      artwork.printSizes = [];
    }

    artwork.available = formData.get('available') === 'on';
    artwork.featured = formData.get('featured') === 'on';

    const tagsRaw = formData.get('tags') as string;
    artwork.tags = tagsRaw
      ? tagsRaw.split(',').map((t) => t.trim()).filter(Boolean)
      : [];

    await artwork.save();

    return new Response(JSON.stringify(artwork), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Update artwork error:', err);
    return new Response(JSON.stringify({ error: 'Server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const DELETE: APIRoute = async ({ params }) => {
  try {
    await connectDB();
    const artwork = await Artwork.findById(params.id);
    if (!artwork) {
      return new Response(JSON.stringify({ error: 'Not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    await deleteImages(artwork.imageUrl, artwork.thumbnailUrl);
    await artwork.deleteOne();

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Delete artwork error:', err);
    return new Response(JSON.stringify({ error: 'Server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
