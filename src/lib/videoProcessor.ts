import { writeFile, unlink, mkdir } from 'fs/promises';
import { join } from 'path';
import { v4 as uuid } from 'uuid';

const UPLOAD_DIR = process.env.UPLOAD_DIR ?? './uploads';
const VIDEO_DIR = join(UPLOAD_DIR, 'videos');

export const VIDEO_MAX_BYTES = 30 * 1024 * 1024; // 30 MB
export const VIDEO_ALLOWED_TYPES = ['video/mp4', 'video/webm'] as const;

export async function processVideo(buffer: Buffer, mimeType: string): Promise<string> {
  if (!VIDEO_ALLOWED_TYPES.includes(mimeType as never)) {
    throw new Error('Invalid format. Only MP4 and WebM are accepted.');
  }
  if (buffer.byteLength > VIDEO_MAX_BYTES) {
    throw new Error('Video exceeds the 30 MB limit.');
  }

  const ext = mimeType === 'video/webm' ? '.webm' : '.mp4';
  const filename = uuid() + ext;

  await mkdir(VIDEO_DIR, { recursive: true });
  await writeFile(join(VIDEO_DIR, filename), buffer);

  return `/uploads/videos/${filename}`;
}

export async function deleteVideo(videoUrl: string): Promise<void> {
  try {
    const filename = videoUrl.split('/').pop();
    if (filename) await unlink(join(VIDEO_DIR, filename));
  } catch {
    // file already gone — ignore
  }
}
