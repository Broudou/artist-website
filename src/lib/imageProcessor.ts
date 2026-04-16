import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs/promises';

function getUploadDir(): string {
  return (
    import.meta.env.UPLOAD_DIR ||
    process.env.UPLOAD_DIR ||
    path.join(process.cwd(), 'uploads')
  );
}

export interface ProcessedImage {
  imageUrl: string;
  thumbnailUrl: string;
}

export async function processImage(
  buffer: Buffer,
  mimeType: string
): Promise<ProcessedImage> {
  if (!mimeType.startsWith('image/')) {
    throw new Error('File must be an image');
  }

  const uploadDir = getUploadDir();
  const processedDir = path.join(uploadDir, 'processed');
  const thumbsDir = path.join(uploadDir, 'thumbs');

  await fs.mkdir(processedDir, { recursive: true });
  await fs.mkdir(thumbsDir, { recursive: true });

  const filename = `${uuidv4()}.jpg`;
  const processedPath = path.join(processedDir, filename);
  const thumbPath = path.join(thumbsDir, filename);

  await sharp(buffer)
    .resize(1920, 1920, { fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 85, progressive: true })
    .toFile(processedPath);

  await sharp(buffer)
    .resize(600, 600, { fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 80 })
    .toFile(thumbPath);

  return {
    imageUrl: `/uploads/processed/${filename}`,
    thumbnailUrl: `/uploads/thumbs/${filename}`,
  };
}

export async function deleteImages(
  imageUrl: string,
  thumbnailUrl: string
): Promise<void> {
  const uploadDir = getUploadDir();

  const toPath = (url: string) =>
    path.join(uploadDir, url.replace('/uploads/', ''));

  await Promise.allSettled([
    fs.unlink(toPath(imageUrl)),
    fs.unlink(toPath(thumbnailUrl)),
  ]);
}
