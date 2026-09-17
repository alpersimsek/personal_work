import 'dotenv/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Knex } from 'knex';

// Knex resolves migrations/seeds `directory` relative to `process.cwd()`,
// not relative to this file. Our npm scripts run `tsx server/db/*.ts` from
// the repository root, so a plain './migrations' would not resolve. Anchor
// both paths to this file's location so they work regardless of cwd.
const currentDir = path.dirname(fileURLToPath(import.meta.url));
const extension = path.extname(fileURLToPath(import.meta.url)).slice(1);

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is not set`);
  }
  return value;
}

const shared: Knex.Config = {
  client: 'mysql2',
  migrations: {
    directory: path.join(currentDir, 'migrations'),
    extension,
    loadExtensions: [`.${extension}`],
  },
  seeds: {
    directory: path.join(currentDir, 'seeds'),
    extension,
    loadExtensions: [`.${extension}`],
  },
};

const connectionFor = (databaseSuffix = ''): Knex.MySql2ConnectionConfig => ({
  host: requireEnv('DB_HOST'),
  port: Number(process.env.DB_PORT) || 3306,
  user: requireEnv('DB_USER'),
  password: requireEnv('DB_PASSWORD'),
  database: `${requireEnv('DB_NAME')}${databaseSuffix}`,
});

const config: Record<string, Knex.Config> = {
  development: { ...shared, connection: connectionFor() },
  test: { ...shared, connection: connectionFor('_test') },
  production: { ...shared, connection: connectionFor(), pool: { min: 2, max: 10 } },
};

export default config;
