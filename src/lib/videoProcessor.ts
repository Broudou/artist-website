import { writeFile, unlink, mkdir } from 'fs/promises';
import { join } from 'path';
import { homedir } from 'os';
import { v4 as uuid } from 'uuid';

function getUploadDir(): string {
  const raw = process.env.UPLOAD_DIR ?? join(process.cwd(), 'uploads');
  return raw.startsWith('~/') ? join(homedir(), raw.slice(2)) : raw;
}

export const VIDEO_MAX_BYTES = 30 * 1024 * 1024; // 30 MB
export const VIDEO_ALLOWED_TYPES = ['video/mp4', 'video/webm'] as const;

export async function processVideo(buffer: Buffer, mimeType: string): Promise<string> {
  if (!VIDEO_ALLOWED_TYPES.includes(mimeType as never)) {
    throw new Error('Invalid format. Only MP4 and WebM are accepted.');
  }
  if (buffer.byteLength > VIDEO_MAX_BYTES) {
    throw new Error('Video exceeds the 30 MB limit.');
  }

  const videoDir = join(getUploadDir(), 'videos');
  const ext = mimeType === 'video/webm' ? '.webm' : '.mp4';
  const filename = uuid() + ext;

  await mkdir(videoDir, { recursive: true });
  await writeFile(join(videoDir, filename), buffer);

  return `/uploads/videos/${filename}`;
}

export async function deleteVideo(videoUrl: string): Promise<void> {
  try {
    const filename = videoUrl.split('/').pop();
    if (filename) await unlink(join(getUploadDir(), 'videos', filename));
  } catch {
    // file already gone — ignore
  }
}
