import path from 'node:path';
import { createHash, randomUUID } from 'node:crypto';
import { mkdir, rename, rm, writeFile } from 'node:fs/promises';
import { HttpError } from '../middleware/errorHandler.js';

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const IMAGE_PATH = /^\/uploads\/blog\/[a-f0-9]{64}\.(jpg|png|webp)$/;

export function uploadsDirectory(): string {
  if (process.env.NODE_ENV === 'test' && !process.env.UPLOADS_DIR) {
    throw new Error('Tests must set an isolated UPLOADS_DIR.');
  }
  return path.resolve(process.env.UPLOADS_DIR || 'uploads');
}

export async function storeBlogImage(bytes: Buffer, mime: string): Promise<string> {
  if (!bytes.length) throw new HttpError(400, 'Görsel dosyası boş.');
  if (bytes.length > MAX_IMAGE_BYTES) throw new HttpError(413, 'Görsel en fazla 5 MB olabilir.');
  const png = bytes.length >= 24 && bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  const jpeg = bytes.length >= 4 && bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255 && bytes.subarray(-2).equals(Buffer.from([255, 217]));
  const webp = bytes.length >= 20 && bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP';
  const extension = mime === 'image/png' && png ? 'png'
    : mime === 'image/jpeg' && jpeg ? 'jpg'
    : mime === 'image/webp' && webp ? 'webp' : undefined;
  if (!extension) throw new HttpError(400, 'Yalnızca PNG, JPG veya WebP görselleri yüklenebilir.');
  const filename = `${createHash('sha256').update(bytes).digest('hex')}.${extension}`;
  const directory = path.join(uploadsDirectory(), 'blog');
  await mkdir(directory, { recursive: true });
  // Content-based names make retries/migration idempotent and never use client filenames.
  const temporary = path.join(directory, `.${randomUUID()}.tmp`);
  try {
    await writeFile(temporary, bytes, { flag: 'wx', mode: 0o644 });
    // Publish complete files atomically; readers/retries must never see partial bytes.
    await rename(temporary, path.join(directory, filename));
  } finally { await rm(temporary, { force: true }); }
  return `/uploads/blog/${filename}`;
}

export async function storeLegacyDataImage(value: string): Promise<string> {
  const match = /^data:(image\/(?:png|jpeg|webp));base64,([A-Za-z0-9+/]+={0,2})$/.exec(value);
  if (!match) throw new HttpError(400, 'Geçersiz eski görsel verisi.');
  const bytes = Buffer.from(match[2], 'base64');
  if (bytes.toString('base64') !== match[2]) throw new HttpError(400, 'Geçersiz eski görsel verisi.');
  return storeBlogImage(bytes, match[1]);
}
