import type { APIRoute } from 'astro';
import { connectDB } from '../../../lib/db';
import { SiteContent } from '../../../lib/models/SiteContent';
import { processImage } from '../../../lib/imageProcessor';
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
      if (typeof value === 'string' && field !== '_method' && field !== 'removeVideo') {
        updates[field] = value;
      }
    }

    const portraitFile = formData.get('portrait') as File | null;
    if (portraitFile && portraitFile.size > 0) {
      const buffer = Buffer.from(await portraitFile.arrayBuffer());
      const { imageUrl } = await processImage(buffer, portraitFile.type);
      updates.aboutPortraitUrl = imageUrl;
    }

    // Handle video removal before potential new upload
    const removeVideo = formData.get('removeVideo');
    if (removeVideo === '1') {
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
