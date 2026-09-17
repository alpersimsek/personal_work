# Backend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Progress (2026-09-17, Codex):** Tasks 1–8 and the additional Task 10 blog backup/restore complete. Task 9 locally prepared and tested; live deployment awaits hosting/domain/access. Task reports and current handoff: `docs/superpowers/backend-handoff.md`. The step checkboxes below are the original recipe; completion evidence is in the task reports.

**Goal:** Replace the client-side-only admin login and localStorage blog storage with a real Express + MariaDB backend, add a subscribers table for the future mailing-list feature, and wire the existing React frontend to call it.

**Architecture:** A new `server/` directory holds a TypeScript Express app (routes, middleware, Knex-based repositories). It runs standalone in dev (proxied from Vite) and, in production, also serves the built `dist/` frontend from the same process, since the target hosting runs one Node process per app. Auth uses a JWT in an httpOnly cookie, verified server-side against a bcrypt hash — this replaces the client-side password check that shipped credentials into the browser bundle.

**Tech Stack:** Express, Knex (MySQL/MariaDB query builder + migrations), `mysql2`, `bcryptjs` (pure JS — no native compile step, required for the target shared/CloudLinux hosting), `jsonwebtoken`, `zod`, `express-rate-limit`, `cookie-parser`, `express-async-errors`. Tests via Node's built-in `node --test` (run through the existing `tsx` dependency) plus `supertest`.

**Spec:** `docs/superpowers/specs/2026-09-17-backend-design.md`

## Global Constraints

- Node version: 20.x locally (`.nvmrc`, already in repo) and on the target hosting (which supports 16–24).
- Database: MariaDB 10.6+ (local via the existing `docker-compose.yml`, production via the host's provisioned database).
- Every new server-side runtime dependency must be pure JavaScript — no native/compiled addons — because the target cPanel/CloudLinux hosting environment is unreliable for compiling native bindings. This is why `bcryptjs` is used instead of `bcrypt`.
- Auth session lives in an httpOnly, Secure (in production), `SameSite=Lax` cookie named `session` — never in `localStorage`, never readable by JS.
- No new frontend test framework is introduced in this plan (the frontend currently has none; adding one is out of scope — verification for frontend changes is `npm run lint` plus a manual browser smoke test, called out explicitly in Task 8).
- **Superseded by owner request, 2026-09-17:** the browser-only JSON export/import was removed in Task 8, then server-backed admin backup/restore was explicitly requested and implemented as Task 10. Keep the new validated transactional endpoints and frontend controls. See docs/superpowers/reports/task-10-blog-backup-report.md. The older Task 8 recipe below is historical and does not authorize removing Task 10.

- The subscribers feature in this plan is backend-only (table + `POST /api/subscribe` + `GET /api/admin/subscribers`). No frontend signup form or mailing-list provider integration — both are explicitly deferred by the project owner to a later, separate piece of work.

---

## File Structure

```
server/
  tsconfig.json
  app.ts                          — Express app factory (exported for tests)
  index.ts                        — entry point: creates app, calls .listen()
  types.ts                        — SessionPayload and other shared server types
  db/
    knexfile.ts                   — per-environment connection config
    knex.ts                       — the shared Knex instance
    migrate.ts                    — runs `knex.migrate.latest()`
    seed.ts                       — runs `knex.seed.run()`
    testReset.ts                  — (re)creates the `_test` database and migrates+seeds it
    migrations/
      20260917000001_create_users_table.ts
      20260917000002_create_blog_posts_table.ts
      20260917000003_create_subscribers_table.ts
    seeds/
      001_admin_user.ts
  middleware/
    errorHandler.ts                — HttpError class + Express error-handling middleware
    requireAuth.ts
    rateLimit.ts
  utils/
    password.ts
    jwt.ts
  validation/
    schemas.ts
  repositories/
    usersRepo.ts
    postsRepo.ts
    subscribersRepo.ts
  routes/
    auth.ts
    posts.ts
    subscribers.ts
  test/
    health.test.ts
    password.test.ts
    jwt.test.ts
    auth.routes.test.ts
    posts.routes.test.ts
    subscribers.routes.test.ts
    static.test.ts
```

Root-level files touched: `package.json`, `tsconfig.json`, `vite.config.ts`, `.env`, `.env.example`, and the five frontend files that call `authService`/`blogService` (`src/services/authService.ts`, `src/services/blogService.ts`, `src/pages/BlogPage.tsx`, `src/pages/BlogDetailPage.tsx`, `src/pages/BlogAdminPage.tsx`, `src/components/BlogSection.tsx`, `src/components/BlogAdminModal.tsx`).

---

### Task 1: Backend scaffolding — Express app skeleton with a health check

**Files:**
- Modify: `package.json`
- Modify: `tsconfig.json` (root)
- Modify: `vite.config.ts`
- Modify: `.env`, `.env.example`
- Create: `server/tsconfig.json`
- Create: `server/app.ts`
- Create: `server/index.ts`
- Test: `server/test/health.test.ts`

**Interfaces:**
- Produces: `createApp(options?: { staticDir?: string; serveStatic?: boolean }): express.Express` from `server/app.ts` — every later task imports this to add routes, and every test imports it to build a fresh app instance.

- [ ] **Step 1: Install backend dependencies**

Run:
```bash
npm install express knex mysql2 bcryptjs jsonwebtoken zod express-rate-limit cookie-parser express-async-errors
npm install --save-dev @types/bcryptjs @types/jsonwebtoken @types/cookie-parser supertest @types/supertest
```

(`express`, `dotenv`, `@types/express`, `@types/node`, and `tsx` are already dependencies.)

- [ ] **Step 2: Add scripts and the `engines` field stays as-is; add new scripts to `package.json`**

In `package.json`, inside `"scripts"`, add these entries (keep the existing ones):

```json
    "dev:api": "tsx watch server/index.ts",
    "build:server": "tsc -p server/tsconfig.json",
    "start": "node dist-server/index.js",
    "lint:server": "tsc -p server/tsconfig.json --noEmit",
    "db:migrate": "tsx server/db/migrate.ts",
    "db:seed": "tsx server/db/seed.ts",
    "db:test:reset": "NODE_ENV=test tsx server/db/testReset.ts",
    "test:server": "NODE_ENV=test node --import tsx --test server/test/*.test.ts"
```

- [ ] **Step 3: Exclude `server/` from the root (frontend) TypeScript config**

In `tsconfig.json`, add an `"exclude"` array so the frontend's `tsc --noEmit` (the existing `npm run lint`) doesn't also try to type-check backend files under a mismatched (DOM/bundler) config:

```json
  "exclude": ["server", "dist-server", "node_modules", "dist"]
```

- [ ] **Step 4: Create `server/tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "lib": ["ES2022"],
    "outDir": "../dist-server",
    "rootDir": ".",
    "strict": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "esModuleInterop": true
  },
  "include": ["**/*.ts"],
  "exclude": ["test", "node_modules"]
}
```

`NodeNext` module resolution requires internal relative imports to use an explicit `.js` extension even though the source files are `.ts` — every server file created in this plan follows that convention (e.g. `import { db } from '../db/knex.js';`). `tsx` (used for local dev and tests) resolves these `.js` specifiers back to the `.ts` source automatically.

- [ ] **Step 5: Add the Vite dev-server proxy**

In `vite.config.ts`, inside the `server` object (alongside the existing `hmr`/`watch` keys), add:

```ts
      proxy: {
        '/api': {
          target: 'http://localhost:3001',
          changeOrigin: true,
        },
      },
```

- [ ] **Step 6: Add new environment variables**

In both `.env` and `.env.example`, add:

```
API_PORT="3001"
JWT_SECRET="change-me-to-a-long-random-string"
ADMIN_USERNAME="admin"
ADMIN_PASSWORD="change-me"
```

In `.env` specifically (not committed), generate a real random secret instead of the placeholder:
```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```
Paste that value in as `JWT_SECRET`, and pick a real `ADMIN_PASSWORD` you'll actually use to log in locally.

- [ ] **Step 7: Write the failing test**

Create `server/test/health.test.ts`:

```ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { createApp } from '../app.js';

test('GET /api/health returns ok status', async () => {
  const app = createApp();
  const response = await request(app).get('/api/health');
  assert.equal(response.status, 200);
  assert.deepEqual(response.body, { status: 'ok' });
});
```

- [ ] **Step 8: Run the test and confirm it fails**

Run: `npm run test:server`
Expected: FAIL — `Cannot find module '../app.js'` (or similar), since `server/app.ts` doesn't exist yet.

- [ ] **Step 9: Create `server/app.ts`**

```ts
import 'express-async-errors';
import express from 'express';
import cookieParser from 'cookie-parser';
import { errorHandler } from './middleware/errorHandler.js';

export function createApp(_options: { staticDir?: string; serveStatic?: boolean } = {}) {
  const app = express();
  app.use(express.json({ limit: '15mb' }));
  app.use(cookieParser());

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.use(errorHandler);

  return app;
}
```

- [ ] **Step 10: Create `server/middleware/errorHandler.ts`**

```ts
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
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
}
```

- [ ] **Step 11: Create `server/index.ts`**

```ts
import 'dotenv/config';
import { createApp } from './app.js';

const port = Number(process.env.API_PORT) || 3001;
const app = createApp({ serveStatic: process.env.NODE_ENV === 'production' });

app.listen(port, () => {
  console.log(`API server listening on port ${port}`);
});
```

- [ ] **Step 12: Run the test again and confirm it passes**

Run: `npm run test:server`
Expected: PASS

- [ ] **Step 13: Manually verify the dev server actually starts**

Run: `npm run dev:api` (leave it running), then in another terminal:
```bash
curl http://localhost:3001/api/health
```
Expected: `{"status":"ok"}`. Stop the dev server (Ctrl+C) when confirmed.

- [ ] **Step 14: Commit**

```bash
git add package.json tsconfig.json vite.config.ts .env.example server/
git commit -m "Add Express backend scaffolding with a health-check endpoint"
```

(`.env` is gitignored and won't be staged — that's expected.)

---

### Task 2: Database migrations, seed, and the test-database reset script

**Files:**
- Create: `server/db/knexfile.ts`
- Create: `server/db/knex.ts`
- Create: `server/db/migrate.ts`
- Create: `server/db/seed.ts`
- Create: `server/db/testReset.ts`
- Create: `server/db/migrations/20260917000001_create_users_table.ts`
- Create: `server/db/migrations/20260917000002_create_blog_posts_table.ts`
- Create: `server/db/migrations/20260917000003_create_subscribers_table.ts`
- Create: `server/db/seeds/001_admin_user.ts`
- Test: `server/test/db.test.ts`

**Interfaces:**
- Consumes: `process.env.DB_HOST/DB_PORT/DB_USER/DB_PASSWORD/DB_NAME/DB_ROOT_PASSWORD` (already in `.env`/`.env.example` from the earlier local-dev setup), `process.env.ADMIN_USERNAME/ADMIN_PASSWORD` (Task 1).
- Produces: `db` (a Knex instance) exported from `server/db/knex.ts` — every repository in later tasks imports this.

- [ ] **Step 1: Make sure the local database container is running**

Run: `npm run db:up`
Expected: `mariadb` and `adminer` containers report `Up`/`healthy` (already verified working in a previous session).

- [ ] **Step 2: Create `server/db/knexfile.ts`**

```ts
import 'dotenv/config';
import type { Knex } from 'knex';

const shared: Knex.Config = {
  client: 'mysql2',
  migrations: {
    directory: './migrations',
    extension: 'ts',
  },
  seeds: {
    directory: './seeds',
    extension: 'ts',
  },
};

const connectionFor = (databaseSuffix = ''): Knex.ConnectionConfig => ({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: `${process.env.DB_NAME}${databaseSuffix}`,
});

const config: Record<string, Knex.Config> = {
  development: { ...shared, connection: connectionFor() },
  test: { ...shared, connection: connectionFor('_test') },
  production: { ...shared, connection: connectionFor(), pool: { min: 2, max: 10 } },
};

export default config;
```

- [ ] **Step 3: Create `server/db/knex.ts`**

```ts
import knexLib from 'knex';
import knexConfig from './knexfile.js';

function currentEnvironment(): 'development' | 'test' | 'production' {
  if (process.env.NODE_ENV === 'production') return 'production';
  if (process.env.NODE_ENV === 'test') return 'test';
  return 'development';
}

export const db = knexLib(knexConfig[currentEnvironment()]);
```

- [ ] **Step 4: Create the users migration — `server/db/migrations/20260917000001_create_users_table.ts`**

```ts
import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('users', (table) => {
    table.increments('id').primary();
    table.string('username', 50).notNullable().unique();
    table.string('email', 255).unique();
    table.string('password_hash', 255).notNullable();
    table.enum('role', ['admin', 'user']).notNullable().defaultTo('admin');
    table.timestamps(true, true);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('users');
}
```

- [ ] **Step 5: Create the blog posts migration — `server/db/migrations/20260917000002_create_blog_posts_table.ts`**

```ts
import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('blog_posts', (table) => {
    table.increments('id').primary();
    table.string('slug', 255).notNullable().unique();
    table.string('title', 255).notNullable();
    table.text('summary');
    table.text('content', 'longtext');
    table.string('category', 100);
    table.json('tags');
    table.string('author', 100);
    table.string('read_time', 50);
    table.text('cover_image', 'longtext');
    table.boolean('published').notNullable().defaultTo(true);
    table.boolean('featured').notNullable().defaultTo(false);
    table.integer('likes').notNullable().defaultTo(0);
    table.integer('views').notNullable().defaultTo(0);
    table.timestamps(true, true);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('blog_posts');
}
```

- [ ] **Step 6: Create the subscribers migration — `server/db/migrations/20260917000003_create_subscribers_table.ts`**

```ts
import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('subscribers', (table) => {
    table.increments('id').primary();
    table.string('name', 255).notNullable();
    table.string('email', 255).notNullable().unique();
    table.boolean('consent_given').notNullable();
    table.datetime('consent_at').notNullable();
    table.datetime('unsubscribed_at');
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('subscribers');
}
```

- [ ] **Step 7: Create `server/db/migrate.ts`**

```ts
import { db } from './knex.js';

async function main(): Promise<void> {
  await db.migrate.latest();
  console.log('Migrations complete');
  await db.destroy();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
```

- [ ] **Step 8: Run the migrations against the local dev database**

Run: `npm run db:migrate`
Expected: `Migrations complete`, no errors.

- [ ] **Step 9: Create the admin seed — `server/db/seeds/001_admin_user.ts`**

```ts
import type { Knex } from 'knex';
import bcrypt from 'bcryptjs';

export async function seed(knex: Knex): Promise<void> {
  const username = (process.env.ADMIN_USERNAME ?? '').trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD ?? '';
  if (!username || !password) {
    throw new Error('ADMIN_USERNAME and ADMIN_PASSWORD must be set to seed the admin user.');
  }

  const existing = await knex('users').where({ username }).first();
  if (existing) return;

  const passwordHash = await bcrypt.hash(password, 12);
  await knex('users').insert({ username, password_hash: passwordHash, role: 'admin' });
}
```

- [ ] **Step 10: Create `server/db/seed.ts`**

```ts
import 'dotenv/config';
import { db } from './knex.js';

async function main(): Promise<void> {
  await db.seed.run();
  console.log('Seed complete');
  await db.destroy();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
```

- [ ] **Step 11: Run the seed against the local dev database**

Run: `npm run db:seed`
Expected: `Seed complete`.

- [ ] **Step 12: Create `server/db/testReset.ts`**

```ts
import 'dotenv/config';
import knexLib from 'knex';

async function main(): Promise<void> {
  const rootDb = knexLib({
    client: 'mysql2',
    connection: {
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT) || 3306,
      user: 'root',
      password: process.env.DB_ROOT_PASSWORD,
    },
  });

  const testDbName = `${process.env.DB_NAME}_test`;
  await rootDb.raw(`DROP DATABASE IF EXISTS \`${testDbName}\``);
  await rootDb.raw(`CREATE DATABASE \`${testDbName}\``);
  await rootDb.destroy();

  const { db } = await import('./knex.js');
  await db.migrate.latest();
  await db.seed.run();
  await db.destroy();
  console.log('Test database reset complete');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
```

This script must run with `NODE_ENV=test` already set (the `db:test:reset` npm script from Task 1 does this) — the dynamic `import('./knex.js')` after that ensures the Knex instance picks up the `test` config, which points at `<DB_NAME>_test`.

- [ ] **Step 13: Write the test**

Create `server/test/db.test.ts`:

```ts
import 'dotenv/config';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { db } from '../db/knex.js';

test('migrations create the expected tables and the seed creates the admin user', async () => {
  const tables = await db.raw(
    "SELECT table_name FROM information_schema.tables WHERE table_schema = DATABASE()"
  );
  const tableNames = tables[0].map((row: { table_name: string; TABLE_NAME?: string }) =>
    (row.table_name ?? row.TABLE_NAME).toLowerCase()
  );
  assert.ok(tableNames.includes('users'));
  assert.ok(tableNames.includes('blog_posts'));
  assert.ok(tableNames.includes('subscribers'));

  const admin = await db('users').where({ username: process.env.ADMIN_USERNAME?.toLowerCase() }).first();
  assert.ok(admin, 'expected the seeded admin user to exist');
  assert.equal(admin.role, 'admin');
});
```

- [ ] **Step 14: Reset the test database and run the test**

Run:
```bash
npm run db:test:reset
npm run test:server
```
Expected: PASS. (From this point on, every task's test-running steps assume `npm run db:test:reset` has been run at least once; re-run it whenever a migration changes.)

- [ ] **Step 15: Commit**

```bash
git add server/db server/test/db.test.ts
git commit -m "Add database migrations, admin seed, and test-database reset script"
```

---

### Task 3: Password hashing and JWT session utilities

**Files:**
- Create: `server/utils/password.ts`
- Create: `server/utils/jwt.ts`
- Create: `server/types.ts`
- Test: `server/test/password.test.ts`
- Test: `server/test/jwt.test.ts`

**Interfaces:**
- Produces: `hashPassword(plain: string): Promise<string>`, `verifyPassword(plain: string, hash: string): Promise<boolean>` from `server/utils/password.ts`.
- Produces: `SessionPayload` (from `server/types.ts`), `signSession(payload: SessionPayload): string`, `verifySession(token: string): SessionPayload` from `server/utils/jwt.ts` — Task 4's auth routes and middleware use these directly.

- [ ] **Step 1: Write the failing tests**

Create `server/test/password.test.ts`:

```ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { hashPassword, verifyPassword } from '../utils/password.js';

test('verifyPassword accepts the correct password', async () => {
  const hash = await hashPassword('correct horse battery staple');
  assert.equal(await verifyPassword('correct horse battery staple', hash), true);
});

test('verifyPassword rejects a wrong password', async () => {
  const hash = await hashPassword('correct horse battery staple');
  assert.equal(await verifyPassword('wrong password', hash), false);
});
```

Create `server/types.ts`:

```ts
export interface SessionPayload {
  userId: number;
  username: string;
  role: 'admin' | 'user';
}
```

Create `server/test/jwt.test.ts`:

```ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { signSession, verifySession } from '../utils/jwt.js';

test('verifySession decodes what signSession produced', () => {
  process.env.JWT_SECRET = 'test-secret';
  const token = signSession({ userId: 1, username: 'admin', role: 'admin' });
  const decoded = verifySession(token);
  assert.equal(decoded.userId, 1);
  assert.equal(decoded.username, 'admin');
  assert.equal(decoded.role, 'admin');
});

test('verifySession throws on a tampered token', () => {
  process.env.JWT_SECRET = 'test-secret';
  const token = signSession({ userId: 1, username: 'admin', role: 'admin' });
  assert.throws(() => verifySession(`${token}tampered`));
});
```

- [ ] **Step 2: Run the tests and confirm they fail**

Run: `npm run test:server`
Expected: FAIL — `Cannot find module '../utils/password.js'` and `'../utils/jwt.js'`.

- [ ] **Step 3: Create `server/utils/password.ts`**

```ts
import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 12;

export function hashPassword(plainPassword: string): Promise<string> {
  return bcrypt.hash(plainPassword, SALT_ROUNDS);
}

export function verifyPassword(plainPassword: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plainPassword, hash);
}
```

- [ ] **Step 4: Create `server/utils/jwt.ts`**

```ts
import jwt from 'jsonwebtoken';
import type { SessionPayload } from '../types.js';

const EXPIRES_IN = '12h';

function requireSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not configured');
  }
  return secret;
}

export function signSession(payload: SessionPayload): string {
  return jwt.sign(payload, requireSecret(), { expiresIn: EXPIRES_IN });
}

export function verifySession(token: string): SessionPayload {
  return jwt.verify(token, requireSecret()) as SessionPayload;
}
```

- [ ] **Step 5: Run the tests and confirm they pass**

Run: `npm run test:server`
Expected: PASS (all tests, including Tasks 1–2's).

- [ ] **Step 6: Commit**

```bash
git add server/utils server/types.ts server/test/password.test.ts server/test/jwt.test.ts
git commit -m "Add password hashing and JWT session utilities"
```

---

### Task 4: Auth routes — login, logout, session check

**Files:**
- Create: `server/repositories/usersRepo.ts`
- Create: `server/middleware/requireAuth.ts`
- Create: `server/middleware/rateLimit.ts`
- Create: `server/routes/auth.ts`
- Modify: `server/app.ts`
- Test: `server/test/auth.routes.test.ts`

**Interfaces:**
- Consumes: `db` (Task 2), `hashPassword`/`verifyPassword` (Task 3), `signSession`/`verifySession`/`SessionPayload` (Task 3).
- Produces: `requireAuth` Express middleware — Tasks 5 and 6 apply it to their admin routers. `authRouter` (Express `Router`) mounted at `/api/auth`.

- [ ] **Step 1: Create `server/repositories/usersRepo.ts`**

```ts
import { db } from '../db/knex.js';

export interface UserRow {
  id: number;
  username: string;
  email: string | null;
  password_hash: string;
  role: 'admin' | 'user';
  created_at: string;
  updated_at: string;
}

export function findByUsername(username: string): Promise<UserRow | undefined> {
  return db<UserRow>('users').where({ username }).first();
}

export function findById(id: number): Promise<UserRow | undefined> {
  return db<UserRow>('users').where({ id }).first();
}
```

- [ ] **Step 2: Create `server/middleware/rateLimit.ts`**

```ts
import rateLimit from 'express-rate-limit';

export const loginRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Çok fazla deneme yapıldı, lütfen daha sonra tekrar deneyin.' },
});

export const subscribeRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Çok fazla istek gönderildi, lütfen daha sonra tekrar deneyin.' },
});
```

- [ ] **Step 3: Create `server/middleware/requireAuth.ts`**

```ts
import type { Request, Response, NextFunction } from 'express';
import { verifySession } from '../utils/jwt.js';
import type { SessionPayload } from '../types.js';

declare module 'express-serve-static-core' {
  interface Request {
    user?: SessionPayload;
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const token = req.cookies?.session;
  if (!token) {
    res.status(401).json({ error: 'Oturum açılmamış.' });
    return;
  }
  try {
    req.user = verifySession(token);
    next();
  } catch {
    res.status(401).json({ error: 'Geçersiz veya süresi dolmuş oturum.' });
  }
}
```

- [ ] **Step 4: Write the failing test**

Create `server/test/auth.routes.test.ts`:

```ts
import 'dotenv/config';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { createApp } from '../app.js';

const app = createApp();
const adminUsername = (process.env.ADMIN_USERNAME ?? '').toLowerCase();
const adminPassword = process.env.ADMIN_PASSWORD ?? '';

test('POST /api/auth/login succeeds with correct admin credentials', async () => {
  const response = await request(app)
    .post('/api/auth/login')
    .send({ username: adminUsername, password: adminPassword });

  assert.equal(response.status, 200);
  assert.equal(response.body.username, adminUsername);
  assert.ok(response.headers['set-cookie']?.[0].includes('session='));
});

test('POST /api/auth/login rejects a wrong password', async () => {
  const response = await request(app)
    .post('/api/auth/login')
    .send({ username: adminUsername, password: 'definitely-wrong' });
  assert.equal(response.status, 401);
});

test('GET /api/auth/me returns 401 without a session cookie', async () => {
  const response = await request(app).get('/api/auth/me');
  assert.equal(response.status, 401);
});

test('GET /api/auth/me returns the user once logged in', async () => {
  const agent = request.agent(app);
  await agent.post('/api/auth/login').send({ username: adminUsername, password: adminPassword });

  const response = await agent.get('/api/auth/me');
  assert.equal(response.status, 200);
  assert.equal(response.body.username, adminUsername);
});

test('POST /api/auth/logout clears the session', async () => {
  const agent = request.agent(app);
  await agent.post('/api/auth/login').send({ username: adminUsername, password: adminPassword });
  await agent.post('/api/auth/logout');

  const response = await agent.get('/api/auth/me');
  assert.equal(response.status, 401);
});
```

- [ ] **Step 5: Run the test and confirm it fails**

Run: `npm run test:server`
Expected: FAIL — `Cannot find module '../routes/auth.js'` (once you also create the import in the next step) or 404s, since the route doesn't exist yet.

- [ ] **Step 6: Create `server/routes/auth.ts`**

```ts
import { Router } from 'express';
import { z } from 'zod';
import { findByUsername, findById } from '../repositories/usersRepo.js';
import { verifyPassword } from '../utils/password.js';
import { signSession } from '../utils/jwt.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { loginRateLimit } from '../middleware/rateLimit.js';
import { HttpError } from '../middleware/errorHandler.js';

const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

const COOKIE_NAME = 'session';
const COOKIE_MAX_AGE_MS = 12 * 60 * 60 * 1000;

export const authRouter = Router();

authRouter.post('/login', loginRateLimit, async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new HttpError(400, 'Kullanıcı adı ve şifre gereklidir.');
  }

  const username = parsed.data.username.trim().toLowerCase();
  const user = await findByUsername(username);
  const passwordMatches = user ? await verifyPassword(parsed.data.password, user.password_hash) : false;

  if (!user || !passwordMatches) {
    throw new HttpError(401, 'Geçersiz kullanıcı adı veya şifre.');
  }

  const token = signSession({ userId: user.id, username: user.username, role: user.role });
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: COOKIE_MAX_AGE_MS,
  });
  res.json({ username: user.username, role: user.role });
});

authRouter.post('/logout', (_req, res) => {
  res.clearCookie(COOKIE_NAME);
  res.json({ success: true });
});

authRouter.get('/me', requireAuth, async (req, res) => {
  const user = await findById(req.user!.userId);
  if (!user) {
    throw new HttpError(401, 'Oturum geçersiz.');
  }
  res.json({ username: user.username, role: user.role });
});
```

- [ ] **Step 7: Wire the router into `server/app.ts`**

Modify `server/app.ts`: add the import near the top and mount the router before `app.use(errorHandler)`:

```ts
import { authRouter } from './routes/auth.js';
```

```ts
  app.use('/api/auth', authRouter);

  app.use(errorHandler);
```

- [ ] **Step 8: Reset the test database (new seed dependency) and run the tests**

Run:
```bash
npm run db:test:reset
npm run test:server
```
Expected: PASS.

- [ ] **Step 9: Manually verify against the local dev database**

Run: `npm run dev:api`, then in another terminal:
```bash
curl -i -c /tmp/cookies.txt -X POST http://localhost:3001/api/auth/login \
  -H 'Content-Type: application/json' \
  -d "{\"username\":\"$ADMIN_USERNAME\",\"password\":\"$ADMIN_PASSWORD\"}"
curl -i -b /tmp/cookies.txt http://localhost:3001/api/auth/me
```
Expected: first call returns `200` with a `Set-Cookie: session=...` header; second call returns `200` with the username. Stop the dev server when confirmed.

- [ ] **Step 10: Commit**

```bash
git add server/repositories/usersRepo.ts server/middleware/requireAuth.ts server/middleware/rateLimit.ts server/routes/auth.ts server/app.ts server/test/auth.routes.test.ts
git commit -m "Add server-side login, logout, and session-check endpoints"
```

---

### Task 5: Blog posts API — public read endpoints and admin CRUD

**Files:**
- Create: `server/validation/schemas.ts`
- Create: `server/repositories/postsRepo.ts`
- Create: `server/routes/posts.ts`
- Modify: `server/app.ts`
- Test: `server/test/posts.routes.test.ts`

**Interfaces:**
- Consumes: `requireAuth` (Task 4), `db` (Task 2), `HttpError` (Task 1).
- Produces: `postsRouter` (public, mount at `/api/posts`), `adminPostsRouter` (mount at `/api/admin/posts`) from `server/routes/posts.ts`.

- [ ] **Step 1: Create `server/validation/schemas.ts`**

```ts
import { z } from 'zod';

export const createPostSchema = z.object({
  title: z.string().min(1).max(255),
  summary: z.string().max(2000).optional(),
  content: z.string().optional(),
  category: z.string().max(100).optional(),
  tags: z.array(z.string()).optional(),
  author: z.string().max(100).optional(),
  readTime: z.string().max(50).optional(),
  coverImage: z.string().optional(),
  published: z.boolean().optional(),
  featured: z.boolean().optional(),
});

export const updatePostSchema = createPostSchema.partial();

export const subscribeSchema = z.object({
  name: z.string().min(1).max(255),
  email: z.string().email().max(255),
  consent: z.literal(true),
  honeypot: z.string().optional(),
});
```

- [ ] **Step 2: Create `server/repositories/postsRepo.ts`**

```ts
import { db } from '../db/knex.js';

export interface BlogPostRow {
  id: number;
  slug: string;
  title: string;
  summary: string | null;
  content: string | null;
  category: string | null;
  tags: string[] | null;
  author: string | null;
  read_time: string | null;
  cover_image: string | null;
  published: boolean;
  featured: boolean;
  likes: number;
  views: number;
  created_at: string;
  updated_at: string;
}

export interface PostFilters {
  category?: string;
  searchQuery?: string;
  page?: number;
  limit?: number;
}

export interface PostInput {
  title?: string;
  summary?: string;
  content?: string;
  category?: string;
  tags?: string[];
  author?: string;
  readTime?: string;
  coverImage?: string;
  published?: boolean;
  featured?: boolean;
}

export async function listPublished(
  filters: PostFilters
): Promise<{ posts: BlogPostRow[]; total: number }> {
  const { category, searchQuery, page = 1, limit = 6 } = filters;
  let query = db<BlogPostRow>('blog_posts').where({ published: true });

  if (category && category !== 'Tümü') {
    query = query.andWhere({ category });
  }
  if (searchQuery?.trim()) {
    const term = `%${searchQuery.trim()}%`;
    query = query.andWhere((builder) => {
      builder.where('title', 'like', term).orWhere('summary', 'like', term);
    });
  }

  const countRow = await query.clone().count<{ count: string }[]>({ count: 'id' }).first();
  const total = Number(countRow?.count ?? 0);

  const posts = await query
    .clone()
    .orderBy('created_at', 'desc')
    .limit(limit)
    .offset((page - 1) * limit);

  return { posts, total };
}

export function findBySlug(slug: string): Promise<BlogPostRow | undefined> {
  return db<BlogPostRow>('blog_posts').where({ slug }).first();
}

export function findById(id: number): Promise<BlogPostRow | undefined> {
  return db<BlogPostRow>('blog_posts').where({ id }).first();
}

export function listAll(): Promise<BlogPostRow[]> {
  return db<BlogPostRow>('blog_posts').orderBy('created_at', 'desc');
}

export async function incrementViews(id: number): Promise<void> {
  await db('blog_posts').where({ id }).increment('views', 1);
}

export async function incrementLikes(id: number): Promise<number> {
  await db('blog_posts').where({ id }).increment('likes', 1);
  const row = await db<BlogPostRow>('blog_posts').where({ id }).first();
  return row?.likes ?? 0;
}

export async function createPost(slug: string, input: PostInput): Promise<BlogPostRow> {
  const [id] = await db('blog_posts').insert({
    slug,
    title: input.title,
    summary: input.summary ?? '',
    content: input.content ?? '',
    category: input.category ?? null,
    tags: JSON.stringify(input.tags ?? []),
    author: input.author ?? null,
    read_time: input.readTime ?? null,
    cover_image: input.coverImage ?? null,
    published: input.published ?? true,
    featured: input.featured ?? false,
  });
  const created = await findById(id);
  return created!;
}

export async function updatePost(id: number, input: PostInput): Promise<BlogPostRow | undefined> {
  const updates: Record<string, unknown> = { updated_at: db.fn.now() };
  if (input.title !== undefined) updates.title = input.title;
  if (input.summary !== undefined) updates.summary = input.summary;
  if (input.content !== undefined) updates.content = input.content;
  if (input.category !== undefined) updates.category = input.category;
  if (input.tags !== undefined) updates.tags = JSON.stringify(input.tags);
  if (input.author !== undefined) updates.author = input.author;
  if (input.readTime !== undefined) updates.read_time = input.readTime;
  if (input.coverImage !== undefined) updates.cover_image = input.coverImage;
  if (input.published !== undefined) updates.published = input.published;
  if (input.featured !== undefined) updates.featured = input.featured;

  const existing = await findById(id);
  if (!existing) return undefined;

  await db('blog_posts').where({ id }).update(updates);
  return findById(id);
}

export async function deletePost(id: number): Promise<boolean> {
  const deleted = await db('blog_posts').where({ id }).delete();
  return deleted > 0;
}

export async function setPublished(id: number, published: boolean): Promise<BlogPostRow | undefined> {
  const existing = await findById(id);
  if (!existing) return undefined;
  await db('blog_posts').where({ id }).update({ published, updated_at: db.fn.now() });
  return findById(id);
}
```

- [ ] **Step 3: Write the failing test**

Create `server/test/posts.routes.test.ts`:

```ts
import 'dotenv/config';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { createApp } from '../app.js';

const app = createApp();
const adminUsername = (process.env.ADMIN_USERNAME ?? '').toLowerCase();
const adminPassword = process.env.ADMIN_PASSWORD ?? '';

async function loginAgent() {
  const agent = request.agent(app);
  await agent.post('/api/auth/login').send({ username: adminUsername, password: adminPassword });
  return agent;
}

test('admin can create a post and the public endpoint returns it with an incremented view count', async () => {
  const agent = await loginAgent();

  const createResponse = await agent.post('/api/admin/posts').send({
    title: 'Test Yazısı',
    summary: 'Test özeti',
    content: 'Test içerik',
    published: true,
  });
  assert.equal(createResponse.status, 201);
  const slug = createResponse.body.slug;

  const publicResponse = await request(app).get(`/api/posts/${slug}`);
  assert.equal(publicResponse.status, 200);
  assert.equal(publicResponse.body.title, 'Test Yazısı');
  assert.equal(publicResponse.body.views, 1);
});

test('POST /api/admin/posts rejects an unauthenticated request', async () => {
  const response = await request(app).post('/api/admin/posts').send({ title: 'x' });
  assert.equal(response.status, 401);
});

test('POST /api/admin/posts rejects an empty title', async () => {
  const agent = await loginAgent();
  const response = await agent.post('/api/admin/posts').send({ title: '' });
  assert.equal(response.status, 400);
});

test('DELETE /api/admin/posts/:id removes the post', async () => {
  const agent = await loginAgent();
  const createResponse = await agent.post('/api/admin/posts').send({ title: 'Silinecek Yazı' });
  const id = createResponse.body.id;

  const deleteResponse = await agent.delete(`/api/admin/posts/${id}`);
  assert.equal(deleteResponse.status, 200);

  const getResponse = await request(app).get(`/api/posts/${createResponse.body.slug}`);
  assert.equal(getResponse.status, 404);
});

test('PATCH /api/admin/posts/:id/publish toggles published state', async () => {
  const agent = await loginAgent();
  const createResponse = await agent.post('/api/admin/posts').send({ title: 'Taslak Yazı', published: true });
  const id = createResponse.body.id;

  const toggled = await agent.patch(`/api/admin/posts/${id}/publish`);
  assert.equal(toggled.status, 200);
  assert.equal(toggled.body.published, false);
});

test('POST /api/posts/:id/like increments and returns the new like count', async () => {
  const agent = await loginAgent();
  const createResponse = await agent.post('/api/admin/posts').send({ title: 'Beğenilecek Yazı' });
  const id = createResponse.body.id;

  const likeResponse = await request(app).post(`/api/posts/${id}/like`);
  assert.equal(likeResponse.status, 200);
  assert.equal(likeResponse.body.likes, 1);
});
```

- [ ] **Step 4: Run the test and confirm it fails**

Run: `npm run test:server`
Expected: FAIL — routes don't exist yet (404s / import errors once the test imports resolve).

- [ ] **Step 5: Create `server/routes/posts.ts`**

```ts
import { Router } from 'express';
import {
  listPublished,
  findBySlug,
  findById,
  listAll,
  incrementViews,
  incrementLikes,
  createPost,
  updatePost,
  deletePost,
  setPublished,
} from '../repositories/postsRepo.js';
import { createPostSchema, updatePostSchema } from '../validation/schemas.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { HttpError } from '../middleware/errorHandler.js';

export const postsRouter = Router();
export const adminPostsRouter = Router();

function buildSlug(title: string): string {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9ğüşıöç\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
  return `${base}-${Date.now().toString().slice(-4)}`;
}

postsRouter.get('/', async (req, res) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 6;
  const category = typeof req.query.category === 'string' ? req.query.category : undefined;
  const searchQuery = typeof req.query.searchQuery === 'string' ? req.query.searchQuery : undefined;

  const { posts, total } = await listPublished({ category, searchQuery, page, limit });
  res.json({ posts, total, totalPages: Math.ceil(total / limit) || 1, currentPage: page });
});

postsRouter.get('/:slug', async (req, res) => {
  const post = await findBySlug(req.params.slug);
  if (!post) {
    throw new HttpError(404, 'Yazı bulunamadı.');
  }
  await incrementViews(post.id);
  res.json({ ...post, views: post.views + 1 });
});

postsRouter.post('/:id/like', async (req, res) => {
  const id = Number(req.params.id);
  const likes = await incrementLikes(id);
  res.json({ likes });
});

adminPostsRouter.use(requireAuth);

adminPostsRouter.get('/', async (_req, res) => {
  res.json(await listAll());
});

adminPostsRouter.post('/', async (req, res) => {
  const parsed = createPostSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new HttpError(400, 'Geçersiz yazı verisi.');
  }
  const post = await createPost(buildSlug(parsed.data.title), parsed.data);
  res.status(201).json(post);
});

adminPostsRouter.put('/:id', async (req, res) => {
  const parsed = updatePostSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new HttpError(400, 'Geçersiz yazı verisi.');
  }
  const updated = await updatePost(Number(req.params.id), parsed.data);
  if (!updated) {
    throw new HttpError(404, 'Yazı bulunamadı.');
  }
  res.json(updated);
});

adminPostsRouter.delete('/:id', async (req, res) => {
  const deleted = await deletePost(Number(req.params.id));
  if (!deleted) {
    throw new HttpError(404, 'Yazı bulunamadı.');
  }
  res.json({ success: true });
});

adminPostsRouter.patch('/:id/publish', async (req, res) => {
  const id = Number(req.params.id);
  const current = await findById(id);
  if (!current) {
    throw new HttpError(404, 'Yazı bulunamadı.');
  }
  const updated = await setPublished(id, !current.published);
  res.json(updated);
});
```

- [ ] **Step 6: Wire the routers into `server/app.ts`**

Modify `server/app.ts`: add the import and, before `app.use(errorHandler)`:

```ts
import { postsRouter, adminPostsRouter } from './routes/posts.js';
```

```ts
  app.use('/api/posts', postsRouter);
  app.use('/api/admin/posts', adminPostsRouter);

  app.use(errorHandler);
```

- [ ] **Step 7: Run the tests and confirm they pass**

Run: `npm run test:server`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add server/validation server/repositories/postsRepo.ts server/routes/posts.ts server/app.ts server/test/posts.routes.test.ts
git commit -m "Add blog posts API: public read endpoints and admin CRUD"
```

---

### Task 6: Subscribers API — public signup, admin listing

**Files:**
- Create: `server/repositories/subscribersRepo.ts`
- Create: `server/routes/subscribers.ts`
- Modify: `server/app.ts`
- Test: `server/test/subscribers.routes.test.ts`

**Interfaces:**
- Consumes: `subscribeSchema` (Task 5), `requireAuth` (Task 4), `subscribeRateLimit` (Task 4), `HttpError` (Task 1).
- Produces: `subscribersRouter` (mount at `/api/subscribe`), `adminSubscribersRouter` (mount at `/api/admin/subscribers`).

- [ ] **Step 1: Create `server/repositories/subscribersRepo.ts`**

```ts
import { db } from '../db/knex.js';

export interface SubscriberRow {
  id: number;
  name: string;
  email: string;
  consent_given: boolean;
  consent_at: string;
  unsubscribed_at: string | null;
  created_at: string;
}

export function findByEmail(email: string): Promise<SubscriberRow | undefined> {
  return db<SubscriberRow>('subscribers').where({ email }).first();
}

export async function createSubscriber(input: { name: string; email: string }): Promise<SubscriberRow> {
  const [id] = await db('subscribers').insert({
    name: input.name,
    email: input.email,
    consent_given: true,
    consent_at: db.fn.now(),
  });
  const created = await db<SubscriberRow>('subscribers').where({ id }).first();
  return created!;
}

export function listAll(): Promise<SubscriberRow[]> {
  return db<SubscriberRow>('subscribers').orderBy('created_at', 'desc');
}
```

- [ ] **Step 2: Write the failing test**

Create `server/test/subscribers.routes.test.ts`:

```ts
import 'dotenv/config';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { createApp } from '../app.js';

const app = createApp();

test('POST /api/subscribe rejects missing consent', async () => {
  const response = await request(app)
    .post('/api/subscribe')
    .send({ name: 'Test Kullanıcı', email: 'consent-missing@example.com' });
  assert.equal(response.status, 400);
});

test('POST /api/subscribe rejects an invalid email', async () => {
  const response = await request(app)
    .post('/api/subscribe')
    .send({ name: 'Test Kullanıcı', email: 'not-an-email', consent: true });
  assert.equal(response.status, 400);
});

test('POST /api/subscribe stores a valid subscriber and rejects a duplicate', async () => {
  const payload = { name: 'Test Kullanıcı', email: 'unique-subscriber@example.com', consent: true };

  const first = await request(app).post('/api/subscribe').send(payload);
  assert.equal(first.status, 201);

  const duplicate = await request(app).post('/api/subscribe').send(payload);
  assert.equal(duplicate.status, 409);
});

test('POST /api/subscribe silently no-ops when the honeypot field is filled', async () => {
  const response = await request(app).post('/api/subscribe').send({
    name: 'Bot',
    email: 'bot-honeypot@example.com',
    consent: true,
    honeypot: 'filled-in-by-a-bot',
  });
  assert.equal(response.status, 201);

  const dupCheck = await request(app).post('/api/subscribe').send({
    name: 'Bot',
    email: 'bot-honeypot@example.com',
    consent: true,
  });
  assert.equal(dupCheck.status, 201, 'the honeypot request should not have actually created a row');
});

test('GET /api/admin/subscribers requires authentication', async () => {
  const response = await request(app).get('/api/admin/subscribers');
  assert.equal(response.status, 401);
});
```

- [ ] **Step 3: Run the test and confirm it fails**

Run: `npm run test:server`
Expected: FAIL — route doesn't exist yet.

- [ ] **Step 4: Create `server/routes/subscribers.ts`**

```ts
import { Router } from 'express';
import { subscribeSchema } from '../validation/schemas.js';
import { findByEmail, createSubscriber, listAll } from '../repositories/subscribersRepo.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { subscribeRateLimit } from '../middleware/rateLimit.js';
import { HttpError } from '../middleware/errorHandler.js';

export const subscribersRouter = Router();
export const adminSubscribersRouter = Router();

subscribersRouter.post('/', subscribeRateLimit, async (req, res) => {
  const parsed = subscribeSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new HttpError(400, 'Ad, e-posta ve onay gereklidir.');
  }

  if (parsed.data.honeypot) {
    res.status(201).json({ success: true });
    return;
  }

  const email = parsed.data.email.toLowerCase();
  const existing = await findByEmail(email);
  if (existing) {
    throw new HttpError(409, 'Bu e-posta adresi zaten kayıtlı.');
  }

  const subscriber = await createSubscriber({ name: parsed.data.name.trim(), email });
  res.status(201).json({ id: subscriber.id, email: subscriber.email });
});

adminSubscribersRouter.use(requireAuth);

adminSubscribersRouter.get('/', async (_req, res) => {
  res.json(await listAll());
});
```

- [ ] **Step 5: Wire the routers into `server/app.ts`**

Modify `server/app.ts`: add the import and, before `app.use(errorHandler)`:

```ts
import { subscribersRouter, adminSubscribersRouter } from './routes/subscribers.js';
```

```ts
  app.use('/api/subscribe', subscribersRouter);
  app.use('/api/admin/subscribers', adminSubscribersRouter);

  app.use(errorHandler);
```

- [ ] **Step 6: Run the tests and confirm they pass**

Run: `npm run test:server`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add server/repositories/subscribersRepo.ts server/routes/subscribers.ts server/app.ts server/test/subscribers.routes.test.ts
git commit -m "Add subscribers API: public signup with consent tracking, admin listing"
```

---

### Task 7: Serve the built frontend in production, with a proper API 404 boundary

**Files:**
- Modify: `server/app.ts`
- Test: `server/test/static.test.ts`

**Interfaces:**
- Consumes: `createApp({ staticDir?, serveStatic? })` (Task 1 already defined this signature; this task implements the previously-unused options).

- [ ] **Step 1: Write the failing test**

Create `server/test/static.test.ts`:

```ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import request from 'supertest';
import { createApp } from '../app.js';

function makeFixtureDir(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dist-fixture-'));
  fs.writeFileSync(path.join(dir, 'index.html'), '<html><body>fixture</body></html>');
  return dir;
}

test('serves the SPA index.html for a non-API route when static serving is enabled', async () => {
  const app = createApp({ serveStatic: true, staticDir: makeFixtureDir() });
  const response = await request(app).get('/some/frontend/route');
  assert.equal(response.status, 200);
  assert.match(response.text, /fixture/);
});

test('unmatched /api routes return a JSON 404 instead of the SPA fallback', async () => {
  const app = createApp({ serveStatic: true, staticDir: makeFixtureDir() });
  const response = await request(app).get('/api/does-not-exist');
  assert.equal(response.status, 404);
  assert.equal(response.body.error, 'Bulunamadı.');
});
```

- [ ] **Step 2: Run the test and confirm it fails**

Run: `npm run test:server`
Expected: FAIL — a request to `/some/frontend/route` currently 404s since there's no static/fallback handling yet.

- [ ] **Step 3: Update `server/app.ts`**

Add these imports at the top:

```ts
import path from 'node:path';
import { fileURLToPath } from 'node:url';
```

Change the `createApp` signature and body to actually use the options (replacing the `_options` parameter from Task 1 and adding the static/fallback block right before `app.use(errorHandler)`):

```ts
const currentDir = path.dirname(fileURLToPath(import.meta.url));

export function createApp(options: { staticDir?: string; serveStatic?: boolean } = {}) {
  const app = express();
  app.use(express.json({ limit: '15mb' }));
  app.use(cookieParser());

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.use('/api/auth', authRouter);
  app.use('/api/posts', postsRouter);
  app.use('/api/admin/posts', adminPostsRouter);
  app.use('/api/subscribe', subscribersRouter);
  app.use('/api/admin/subscribers', adminSubscribersRouter);

  app.use('/api', (_req, res) => {
    res.status(404).json({ error: 'Bulunamadı.' });
  });

  const serveStatic = options.serveStatic ?? process.env.NODE_ENV === 'production';
  if (serveStatic) {
    const staticDir = options.staticDir ?? path.resolve(currentDir, '../dist');
    app.use(express.static(staticDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(staticDir, 'index.html'));
    });
  }

  app.use(errorHandler);

  return app;
}
```

(This consolidates all the `app.use('/api/...')` mounts that were added incrementally across Tasks 4–6 into one place, plus the new `/api` catch-all and the static/fallback block — the net effect matches what was already there, with the two new pieces added.)

- [ ] **Step 4: Run the tests and confirm they pass**

Run: `npm run test:server`
Expected: PASS (all tests, full suite).

- [ ] **Step 5: Manually verify with a real build**

Run:
```bash
npm run build
npm run build:server
NODE_ENV=production node dist-server/index.js
```
Then in another terminal: `curl -i http://localhost:3001/` — expect the real `dist/index.html` content, status 200. Stop the server (Ctrl+C) when confirmed.

- [ ] **Step 6: Commit**

```bash
git add server/app.ts server/test/static.test.ts
git commit -m "Serve the built frontend from the same Express process in production"
```

---

### Task 8: Frontend integration — point authService and blogService at the real API

**Files:**
- Modify: `src/services/authService.ts`
- Modify: `src/services/blogService.ts`
- Modify: `src/vite-env.d.ts`
- Modify: `.env`, `.env.example`
- Modify: `src/pages/BlogPage.tsx`
- Modify: `src/pages/BlogDetailPage.tsx`
- Modify: `src/pages/BlogAdminPage.tsx`
- Modify: `src/components/BlogSection.tsx`
- Modify: `src/components/BlogAdminModal.tsx`

**Interfaces:**
- Consumes: `/api/auth/*`, `/api/posts/*`, `/api/admin/posts/*` (Tasks 4, 5, 7 — via the Vite proxy from Task 1).
- Produces: `authService.login/getSession/logout` (now all `Promise`-returning) and `blogService.*` (now all `Promise`-returning), matching `BlogPost`/`AdminSession` types unchanged in `src/types.ts`.

There is no frontend test framework in this repo, so verification for this task is `npm run lint` (must pass with zero errors) plus the manual browser walkthrough in Step 10. Do not add a new test framework as part of this task — that's out of scope (see Global Constraints).

- [ ] **Step 1: Rewrite `src/services/authService.ts`**

Replace the entire file:

```ts
import { AdminSession } from '../types';

export const authService = {
  async login(username: string, password: string): Promise<{ success: boolean; message?: string }> {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ username, password }),
    });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      return { success: false, message: data.error ?? 'Geçersiz kullanıcı adı veya şifre.' };
    }
    return { success: true };
  },

  async getSession(): Promise<AdminSession> {
    const response = await fetch('/api/auth/me', { credentials: 'include' });
    if (!response.ok) {
      return { username: '', isLoggedIn: false };
    }
    const data = await response.json();
    return { username: data.username, isLoggedIn: true };
  },

  async logout(): Promise<void> {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
  },
};
```

- [ ] **Step 2: Rewrite `src/services/blogService.ts`**

Replace everything above the `formatCoverImage` function (keep `formatCoverImage` itself completely unchanged — it's pure client-side canvas processing, unrelated to the backend):

```ts
import { BlogPost, BlogFilterOptions } from '../types';

interface ApiBlogPost {
  id: number;
  slug: string;
  title: string;
  summary: string;
  content: string;
  category: string;
  tags: string[];
  author: string;
  read_time: string;
  cover_image: string;
  published: boolean;
  featured: boolean;
  likes: number;
  views: number;
  created_at: string;
  updated_at: string;
}

function toBlogPost(row: ApiBlogPost): BlogPost {
  return {
    id: String(row.id),
    slug: row.slug,
    title: row.title,
    summary: row.summary,
    category: row.category,
    tags: row.tags ?? [],
    author: row.author,
    readTime: row.read_time,
    date: new Date(row.created_at).toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }),
    coverImage: row.cover_image,
    published: row.published,
    featured: row.featured,
    likes: row.likes,
    views: row.views,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    content: row.content,
  };
}

async function parseJsonOrThrow(response: Response): Promise<any> {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || 'Bir hata oluştu.');
  }
  return data;
}

export const blogService = {
  async getPublishedPosts(options: BlogFilterOptions = {}): Promise<{
    posts: BlogPost[];
    total: number;
    totalPages: number;
    currentPage: number;
  }> {
    const params = new URLSearchParams();
    if (options.category && options.category !== 'Tümü') params.set('category', options.category);
    if (options.searchQuery) params.set('searchQuery', options.searchQuery);
    params.set('page', String(options.page ?? 1));
    params.set('limit', String(options.limit ?? 6));

    const response = await fetch(`/api/posts?${params.toString()}`);
    const data = await parseJsonOrThrow(response);
    return {
      posts: data.posts.map(toBlogPost),
      total: data.total,
      totalPages: data.totalPages,
      currentPage: data.currentPage,
    };
  },

  async getAllPosts(): Promise<BlogPost[]> {
    const response = await fetch('/api/admin/posts', { credentials: 'include' });
    const data = await parseJsonOrThrow(response);
    return data.map(toBlogPost);
  },

  async getPostBySlug(slug: string): Promise<BlogPost | undefined> {
    const response = await fetch(`/api/posts/${slug}`);
    if (response.status === 404) return undefined;
    const data = await parseJsonOrThrow(response);
    return toBlogPost(data);
  },

  async likePost(id: string): Promise<number> {
    const response = await fetch(`/api/posts/${id}/like`, { method: 'POST' });
    const data = await parseJsonOrThrow(response);
    return data.likes;
  },

  async createPost(newPostData: Partial<BlogPost>): Promise<BlogPost> {
    const response = await fetch('/api/admin/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(newPostData),
    });
    const data = await parseJsonOrThrow(response);
    return toBlogPost(data);
  },

  async updatePost(id: string, updatedData: Partial<BlogPost>): Promise<BlogPost | null> {
    const response = await fetch(`/api/admin/posts/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(updatedData),
    });
    if (response.status === 404) return null;
    const data = await parseJsonOrThrow(response);
    return toBlogPost(data);
  },

  async deletePost(id: string): Promise<boolean> {
    const response = await fetch(`/api/admin/posts/${id}`, { method: 'DELETE', credentials: 'include' });
    return response.ok;
  },

  async togglePublish(id: string): Promise<boolean> {
    const response = await fetch(`/api/admin/posts/${id}/publish`, { method: 'PATCH', credentials: 'include' });
    const data = await parseJsonOrThrow(response);
    return data.published;
  },
};
```

- [ ] **Step 3: Remove the now-dead client-side admin env vars**

In `src/vite-env.d.ts`, remove the `ImportMetaEnv`/`ImportMeta` block added for the earlier client-side-auth fix (auth is now server-side, so these no longer exist):

```ts
/// <reference types="vite/client" />
```

(the file should contain only that one line afterward).

In both `.env` and `.env.example`, remove the `VITE_ADMIN_USERNAME` and `VITE_ADMIN_PASSWORD_SHA256` lines (and their explanatory comment block in `.env.example`) — they're replaced by the server-side `ADMIN_USERNAME`/`ADMIN_PASSWORD` added in Task 1.

- [ ] **Step 4: Update `src/pages/BlogPage.tsx`**

Replace the `useEffect` that loads posts and the `isAdmin` line:

```ts
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    authService.getSession().then((session) => setIsAdmin(session.isLoggedIn));
  }, []);

  useEffect(() => {
    let cancelled = false;
    blogService
      .getPublishedPosts({
        category: selectedCategory === 'Tümü' ? undefined : selectedCategory,
        searchQuery: searchQuery.trim() || undefined,
        page: currentPage,
        limit: 6,
      })
      .then((result) => {
        if (!cancelled) setPostsData(result);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedCategory, searchQuery, currentPage]);
```

(remove the old `const isAdmin = authService.getSession().isLoggedIn;` line and the old synchronous posts-loading `useEffect` they replace.)

- [ ] **Step 5: Update `src/pages/BlogDetailPage.tsx`**

Replace the `useEffect` that sets related posts:

```ts
  useEffect(() => {
    if (post) {
      setLikesCount(post.likes || 0);
      setHasLiked(false);

      blogService.getPublishedPosts({ limit: 10 }).then(({ posts: allPublished }) => {
        const related = allPublished.filter((p) => p.id !== post.id).slice(0, 2);
        setRelatedPosts(related);
      });
    }
  }, [post]);
```

Replace `handleLike`:

```ts
  const handleLike = async () => {
    if (!hasLiked) {
      const updatedLikes = await blogService.likePost(post.id);
      setLikesCount(updatedLikes);
      setHasLiked(true);
    }
  };
```

- [ ] **Step 6: Update `src/components/BlogSection.tsx`**

Replace the `isAdmin` line and `loadPosts`:

```ts
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    authService.getSession().then((session) => setIsAdmin(session.isLoggedIn));
  }, []);

  const loadPosts = () => {
    blogService
      .getPublishedPosts({ category: selectedCategory, searchQuery, page: currentPage, limit: 6 })
      .then(setPostsData);
  };
```

(remove the old `const isAdmin = authService.getSession().isLoggedIn;` line; `loadPosts` keeps being called from the existing `useEffect(() => { loadPosts(); }, [...])` below it unchanged.)

- [ ] **Step 7: Update `src/pages/BlogAdminPage.tsx`**

Replace the mount `useEffect` and `refreshPosts`:

```ts
  useEffect(() => {
    window.scrollTo(0, 0);
    authService.getSession().then((session) => {
      setIsLoggedIn(session.isLoggedIn);
      if (session.isLoggedIn) {
        refreshPosts();
      }
    });
  }, []);

  const refreshPosts = async () => {
    const data = await blogService.getAllPosts();
    setPosts(data);
  };
```

Replace `handleSavePost`:

```ts
  const handleSavePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      setStatusNotice({ type: 'error', text: 'Lütfen başlık ve içerik alanlarını doldurun.' });
      return;
    }

    const finalCover = coverImage.trim() || DEFAULT_COVER_IMAGE;
    const tagsArr = tagsInput.split(',').map((t) => t.trim()).filter(Boolean);

    try {
      if (editingPost) {
        await blogService.updatePost(editingPost.id, {
          title, category, summary, content, readTime,
          coverImage: finalCover, tags: tagsArr, published, featured,
        });
        setStatusNotice({ type: 'success', text: 'Makale başarıyla güncellendi!' });
      } else {
        await blogService.createPost({
          title, category, summary, content, readTime,
          coverImage: finalCover, tags: tagsArr, published, featured,
        });
        setStatusNotice({ type: 'success', text: 'Yeni makale başarıyla yayınlandı!' });
      }
      await refreshPosts();
      setTimeout(() => {
        setActiveTab('list');
        setStatusNotice(null);
      }, 1200);
    } catch (error) {
      setStatusNotice({ type: 'error', text: error instanceof Error ? error.message : 'Bir hata oluştu.' });
    }
  };
```

Replace `handleDelete`, `handleTogglePublish`, `handleLogout`:

```ts
  const handleDelete = async (id: string, postTitle: string) => {
    if (window.confirm(`"${postTitle}" başlıklı makaleyi silmek istediğinize emin misiniz?`)) {
      await blogService.deletePost(id);
      await refreshPosts();
    }
  };

  const handleTogglePublish = async (id: string) => {
    await blogService.togglePublish(id);
    await refreshPosts();
  };

  const handleLogout = async () => {
    await authService.logout();
    setIsLoggedIn(false);
  };
```

Delete the `handleExportJSON` and `handleImportJSON` functions entirely (localStorage-era backup feature, replaced by the host's own database backups — see Global Constraints).

In the JSX header, delete the "Yedekle" button and the "İçe Aktar" `<label>` (the two elements between the "Blog Sayfası" button and the "Çıkış" button that call `handleExportJSON`/`handleImportJSON`).

- [ ] **Step 8: Update `src/components/BlogAdminModal.tsx`**

Apply the same shape of changes as Step 7, in this file's equivalents:

```ts
  const refreshPosts = async () => {
    const data = await blogService.getAllPosts();
    setPosts(data);
  };
```

```ts
  const handleSavePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      setStatusNotice({ type: 'error', text: 'Lütfen başlık ve içerik alanlarını doldurun.' });
      return;
    }

    const tagsArr = tagsInput.split(',').map((t) => t.trim()).filter(Boolean);

    try {
      if (editingPost) {
        await blogService.updatePost(editingPost.id, {
          title, category, summary, content, readTime, coverImage, tags: tagsArr, published, featured,
        });
        setStatusNotice({ type: 'success', text: 'Makale başarıyla güncellendi!' });
      } else {
        await blogService.createPost({
          title, category, summary, content, readTime, coverImage, tags: tagsArr, published, featured,
        });
        setStatusNotice({ type: 'success', text: 'Yeni makale başarıyla yayınlandı!' });
      }
      await refreshPosts();
      onPostUpdated();
      setTimeout(() => {
        setActiveTab('list');
        setStatusNotice(null);
      }, 1200);
    } catch (error) {
      setStatusNotice({ type: 'error', text: error instanceof Error ? error.message : 'Bir hata oluştu.' });
    }
  };

  const handleDelete = async (id: string, postTitle: string) => {
    if (window.confirm(`"${postTitle}" başlıklı makaleyi silmek istediğinize emin misiniz?`)) {
      await blogService.deletePost(id);
      await refreshPosts();
      onPostUpdated();
    }
  };

  const handleTogglePublish = async (id: string) => {
    await blogService.togglePublish(id);
    await refreshPosts();
    onPostUpdated();
  };

  const handleLogoutClick = async () => {
    await authService.logout();
    onLogout();
    onClose();
  };
```

Delete `handleExportJSON` and `handleImportJSON`, and delete the "Yedekle" button and "İçe Aktar" `<label>` from the header JSX (same reasoning as Step 7).

- [ ] **Step 9: Type-check the whole frontend**

Run: `npm run lint`
Expected: no errors. Fix any remaining type mismatches this surfaces (e.g. a missed call site) before moving on.

- [ ] **Step 10: Manual browser smoke test**

Run, in separate terminals:
```bash
npm run db:up      # if not already running
npm run dev:api
npm run dev
```
In the browser at `http://localhost:3000`:
1. Go to the blog admin login, log in with the `ADMIN_USERNAME`/`ADMIN_PASSWORD` from `.env`. Confirm it succeeds and the admin panel loads with the seeded/empty post list.
2. Create a new post, confirm it appears in the list and (in a new tab, logged out) on the public blog page.
3. Edit the post, toggle publish/unpublish, confirm the public page reflects it.
4. Like a post from the public blog detail page, confirm the like count increases and persists on refresh.
5. Delete the post, confirm it disappears from both admin and public views.
6. Log out, confirm the admin panel is inaccessible and the public page no longer shows the admin controls.

- [ ] **Step 11: Commit**

```bash
git add src/services/authService.ts src/services/blogService.ts src/vite-env.d.ts .env.example \
  src/pages/BlogPage.tsx src/pages/BlogDetailPage.tsx src/pages/BlogAdminPage.tsx \
  src/components/BlogSection.tsx src/components/BlogAdminModal.tsx
git commit -m "Wire the frontend to the real backend API, remove localStorage-era JSON backup feature"
```

(`.env` is gitignored and won't be staged.)

---

### Task 9: Production deployment to the Node.js hosting

**Current status:** live deployment pending hosting access. Follow the corrected `docs/superpowers/deployment.md`; local readiness validation is in `docs/superpowers/reports/task-9-report.md`.

**Files:** none (operational steps against the purchased hosting account — no repo changes beyond what's already committed).

This task has no automated test — it's a one-time (and repeatable-on-redeploy) checklist against real infrastructure that doesn't exist until the hosting plan is purchased. "Testing" it means confirming the live site actually responds correctly at the end.

- [ ] **Step 1: Provision the database**

In the hosting control panel (cPanel), create a MariaDB database and a database user with full privileges on it. Note the database name, username, and password — cPanel typically prefixes these with your account username (e.g. `youracct_tugba_app`).

- [ ] **Step 2: Set environment variables in the Node.js App Manager**

In cPanel's "Setup Node.js App" for this application, set these environment variables (values from Step 1 and freshly generated secrets — do not reuse local `.env` values):

```
NODE_ENV=production
API_PORT=<whatever port the app manager assigns / expects>
DB_HOST=localhost
DB_PORT=3306
DB_NAME=<cPanel database name>
DB_USER=<cPanel database user>
DB_PASSWORD=<cPanel database password>
JWT_SECRET=<new random value: node -e "console.log(require('crypto').randomBytes(48).toString('hex'))">
ADMIN_USERNAME=<the real admin username to use in production>
ADMIN_PASSWORD=<the real admin password to use in production>
```

- [ ] **Step 3: Deploy the code**

Push the repository to the server via the method your cPanel account supports (Git Version Control feature, or upload via File Manager/FTP if Git isn't enabled on your plan). On the server, in the app's root:

```bash
npm ci
npm run build
npm run build:server
npm prune --omit=dev
```

- [ ] **Step 4: Run migrations and seed the production admin user**

Still on the server, with the environment variables from Step 2 in effect (cPanel's Node.js App Manager loads them automatically when you use its "Run NPM Install"/terminal feature for the app):

```bash
npm run db:migrate:prod
npm run db:seed:prod
```

- [ ] **Step 5: Point the app's startup file at the compiled server entry**

In cPanel's Node.js App Manager configuration for this app, set "Application startup file" to `dist-server/index.js`, then restart the app.

- [ ] **Step 6: Verify the live site**

Visit the production domain in a browser:
1. Confirm the homepage and blog pages load.
2. Log in to the blog admin with the production `ADMIN_USERNAME`/`ADMIN_PASSWORD`, create a test post, confirm it appears publicly, then delete it.
3. `curl https://yourdomain.tld/api/health` — confirm `{"status":"ok"}`.

- [ ] **Step 7: Rotate the local `.env` `JWT_SECRET` and `ADMIN_PASSWORD` if they were ever reused from a shared/insecure channel**

Confirm the production values set in Step 2 are not the same as any value that appears in this repo's git history or was shared insecurely. If they are, generate new ones and update them in cPanel.
