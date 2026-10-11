import type { EventEmitter } from 'node:events';
import { flushErrorLog, logError } from './errorLog.js';

type Exit = (code: number) => never;

/**
 * Logs the error class only (never message or stack), flushes, and still
 * ends the process with a non-zero code as Node would have.
 */
export function installFatalErrorHandlers(target: EventEmitter = process, exit: Exit = process.exit): void {
  const die = (event: 'uncaught_exception' | 'unhandled_rejection', error: unknown): void => {
    logError(event, { errorClass: error instanceof Error ? error.name : typeof error });
    flushErrorLog();
    exit(1);
  };
  target.on('uncaughtException', error => die('uncaught_exception', error));
  target.on('unhandledRejection', reason => die('unhandled_rejection', reason));
}

/** Logs a listen failure (for example EADDRINUSE) by its string code only, then exits 1. */
export function exitOnListenError(server: EventEmitter, exit: Exit = process.exit): void {
  server.on('error', (error: unknown) => {
    const code = (error as { code?: unknown } | null)?.code;
    logError('listen_failed', { errorCode: typeof code === 'string' ? code : 'unknown' });
    flushErrorLog();
    exit(1);
  });
}

/**
 * Closes the server and flushes the error log on SIGTERM or SIGINT, which
 * do not emit the `exit` event, so a pending aggregate is not lost.
 */
export function installShutdownHandlers(server: { close(): unknown } | null): void {
  const shutdown = (): void => {
    try { server?.close(); } catch { /* already closed */ }
    flushErrorLog();
    process.exit(0);
  };
  process.once('SIGTERM', shutdown);
  process.once('SIGINT', shutdown);
}
