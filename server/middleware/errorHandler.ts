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
  // Driver errors can embed full SQL statements, passwords and personal data.
  // Log only a fixed diagnostic category, never the error object or request.
  const code = (err as { code?: unknown } | null)?.code;
  const category = typeof code === 'string' &&
    ['ER_DUP_ENTRY', 'ER_DATA_TOO_LONG', 'ER_LOCK_DEADLOCK', 'ECONNREFUSED', 'ETIMEDOUT', 'ENOENT', 'EACCES', 'ENOSPC'].includes(code)
    ? code : 'INTERNAL_ERROR';
  console.error({ event: 'request_failed', status: 500, category });
  res.status(500).json({ error: 'Internal server error' });
}
