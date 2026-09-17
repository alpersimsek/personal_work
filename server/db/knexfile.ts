import 'dotenv/config';
import path from 'node:path';
import { readdir } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import type { Knex } from 'knex';

// Knex resolves migrations/seeds `directory` relative to `process.cwd()`,
// not relative to this file. Our npm scripts run `tsx server/db/*.ts` from
// the repository root, so a plain './migrations' would not resolve. Anchor
// both paths to this file's location so they work regardless of cwd.
const currentDir = path.dirname(fileURLToPath(import.meta.url));
const extension = path.extname(fileURLToPath(import.meta.url)).slice(1);
const migrationsDir = path.join(currentDir, 'migrations');
const migrationSource: Knex.MigrationSource<string> = {
  async getMigrations() {
    return (await readdir(migrationsDir)).filter(name => name.endsWith(`.${extension}`)).sort();
  },
  // Preserve the original recorded .ts identities when executing compiled .js files.
  // This lets a locally migrated database move to hosting without rerunning migrations.
  getMigrationName(name) { return name.replace(/\.js$/, '.ts'); },
  getMigration(name) { return import(pathToFileURL(path.join(migrationsDir, name)).href); },
};

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
    migrationSource,
    extension: 'ts',
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
