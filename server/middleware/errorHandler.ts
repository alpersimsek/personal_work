import type { Request, Response, NextFunction } from 'express';
import { logError } from '../logging/errorLog.js';

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
  // Body-parser and http-errors failures (unsupported charset or encoding,
  // aborted request, too many parameters) are the client's fault: answer with
  // their 4xx status and do not log them as server errors.
  const clientStatus = (err as { status?: unknown; statusCode?: unknown } | null);
  const status = [clientStatus?.status, clientStatus?.statusCode].find(
    (value): value is number => typeof value === 'number' && value >= 400 && value <= 499,
  );
  if (status !== undefined) {
    res.status(status).json({ error: 'Geçersiz istek.' });
    return;
  }
  // Driver errors can embed full SQL statements, passwords and personal data.
  // Log only a fixed diagnostic category, never the error object or request.
  const code = (err as { code?: unknown } | null)?.code;
  const category = typeof code === 'string' &&
    ['ER_DUP_ENTRY', 'ER_DATA_TOO_LONG', 'ER_LOCK_DEADLOCK', 'ECONNREFUSED', 'ETIMEDOUT', 'ENOENT', 'EACCES', 'ENOSPC'].includes(code)
    ? code : 'INTERNAL_ERROR';
  logError('request_failed', { status: 500, category });
  res.status(500).json({ error: 'Internal server error' });
}
