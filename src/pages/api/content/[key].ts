import type { APIRoute } from 'astro';
import { connectDB } from '../../../lib/db';
import { SiteContent } from '../../../lib/models/SiteContent';
import { processImage, deleteImages } from '../../../lib/imageProcessor';
import { processVideo, deleteVideo } from '../../../lib/videoProcessor';

// Auth is enforced by src/middleware.ts for all /api/content/** routes.

// Form method override: HTML forms POST with _method=PUT
export const POST: APIRoute = (ctx) => PUT(ctx);

export const PUT: APIRoute = async ({ request, params }) => {
  try {
    await connectDB();
    const key = params.key as string;
    const formData = await request.formData();
    const updates: Record<string, string> = {};

    for (const [field, value] of formData.entries()) {
      const skip = ['_method', 'removeVideo', 'removeHeroImage'];
      if (typeof value === 'string' && !skip.includes(field)) {
        updates[field] = value;
      }
    }

    // About portrait
    const portraitFile = formData.get('portrait') as File | null;
    if (portraitFile && portraitFile.size > 0) {
      const buffer = Buffer.from(await portraitFile.arrayBuffer());
      const { imageUrl } = await processImage(buffer, portraitFile.type);
      updates.aboutPortraitUrl = imageUrl;
    }

    // Hero image (remove then replace)
    if (formData.get('removeHeroImage') === '1') {
      const existing = await SiteContent.findOne({ key });
      if (existing?.heroImageUrl) await deleteImages(existing.heroImageUrl, '');
      updates.heroImageUrl = '';
    }
    const heroImageFile = formData.get('heroImage') as File | null;
    if (heroImageFile && heroImageFile.size > 0) {
      const existing = await SiteContent.findOne({ key });
      if (existing?.heroImageUrl) await deleteImages(existing.heroImageUrl, '');
      const buffer = Buffer.from(await heroImageFile.arrayBuffer());
      const { imageUrl } = await processImage(buffer, heroImageFile.type);
      updates.heroImageUrl = imageUrl;
    }

    // Hero video (remove then replace)
    if (formData.get('removeVideo') === '1') {
      const existing = await SiteContent.findOne({ key });
      if (existing?.heroVideoUrl) await deleteVideo(existing.heroVideoUrl);
      updates.heroVideoUrl = '';
    }
    const videoFile = formData.get('heroVideo') as File | null;
    if (videoFile && videoFile.size > 0) {
      const existing = await SiteContent.findOne({ key });
      if (existing?.heroVideoUrl) await deleteVideo(existing.heroVideoUrl);
      const buffer = Buffer.from(await videoFile.arrayBuffer());
      updates.heroVideoUrl = await processVideo(buffer, videoFile.type);
    }

    await SiteContent.findOneAndUpdate(
      { key },
      { $set: updates },
      { upsert: true, new: true }
    );

    return new Response(null, {
      status: 302,
      headers: { Location: `/admin/content/${key}?success=1` },
    });
  } catch (err) {
    console.error('Update content error:', err);
    return new Response(null, {
      status: 302,
      headers: { Location: `/admin/content/${params.key}?error=1` },
    });
  }
};
