# Production deployment runbook

Status: prepared locally; live deployment awaits a purchased hosting account, domain, and access details.

Use the backend worktree branch `worktree-backend-implementation`. `main` does not yet include these backend changes. Node 20 is specified in `.nvmrc` and package engines. The app needs a MariaDB database and same-origin HTTPS frontend/API.

## Build and install

There are two supported build paths. Do not omit development dependencies before trying to compile the server: TypeScript is a development dependency.

Build on the hosting machine (if resources allow):

```bash
npm ci
npm run lint
npm run build
npm run build:server
npm prune --omit=dev
```

Or build locally with Node 20 and upload `dist/`, `dist-server/`, `package.json`, and `package-lock.json` to the app root, then run `npm ci --omit=dev` there. Never upload the local `.env`, test database reset script as an operational command, or local credential values. Database migrations and seed are included in the compiled server output.

## Configure hosting

Provision a MariaDB database/user with privileges on that database, then set these app environment variables in the hosting control panel:

```text
NODE_ENV=production
DB_HOST=<database host>
DB_PORT=3306
DB_NAME=<provisioned database name>
DB_USER=<provisioned database user>
DB_PASSWORD=<production database password>
JWT_SECRET=<new random secret>
ADMIN_USERNAME=<production admin username>
ADMIN_PASSWORD=<new production admin password>
```

Use `PORT` if supplied by the host, or set `API_PORT` according to the host's app manager instructions. Startup prefers `PORT`, then `API_PORT`, then 3001. Generate a fresh JWT secret with `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`. Production must use HTTPS because the session cookie is Secure.

Set the application startup file to `dist-server/index.js`; verify the chosen host's Node app manager accepts this ESM entry. If it requires a provider-specific launcher, adapt and validate that after access is available. Do not guess a reverse-proxy trust setting; configure it only against the provider's actual proxy setup and verify rate limiting.

## Initialize the database

With the app's production environment active in its terminal:

```bash
npm run db:migrate:prod
npm run db:seed:prod
```

These commands run compiled JavaScript and need no `tsx` or TypeScript compiler. The seed only creates an admin if that username does not already exist; changing ADMIN_PASSWORD and reseeding does not rotate an existing user's password. Do not run `db:test:reset` in production.

Restart the app through the hosting control panel after environment or code changes.

## Live acceptance checks

- Homepage and blog load; `/api/health` returns `{"status":"ok"}`.
- Unknown `/api/...` returns a JSON 404, never HTML.
- Login succeeds over HTTPS and cookie is httpOnly, Secure, SameSite=Lax.
- Create/edit a temporary post, verify publicly in an independent logged-out session, toggle draft/public, like it, and delete it.
- Logout prevents subsequent admin API access; public pages show login controls.
- Subscriber endpoint rejects absent consent and invalid email; valid signup persists consent time; duplicates return 409; admin listing requires an admin session.

Enable the host's database backups. Signup form placement, consent wording, and mailing-list provider integration remain separate deferred work.
