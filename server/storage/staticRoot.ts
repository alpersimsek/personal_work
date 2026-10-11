import path from 'node:path';
import { fileURLToPath } from 'node:url';

/** The built frontend directory the production server serves. */
export function defaultStaticDirectory(): string {
  return path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../dist');
}
