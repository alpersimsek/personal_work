import type { Request, Response, NextFunction } from 'express';

export class HttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof HttpError) {
    res.status(err.status).json({ error: err.message });
    return;
  }
  const type = (err as { type?: string } | null)?.type;
  if (type === 'entity.parse.failed' || type === 'entity.too.large') {
    res.status(type === 'entity.too.large' ? 413 : 400).json({ error:
      type === 'entity.too.large' ? 'Dosya boyutu izin verilen sınırı aşıyor.' : 'Geçersiz JSON verisi.' });
    return;
  }
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
}
