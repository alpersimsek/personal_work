# Tuğba website

React frontend with an Express API, MariaDB blog/subscriber data, server-verified admin sessions and disk-backed blog images.

## Hosting from GitHub

Clone the `main` branch on the hosting server. From the repository root, using the app's Node 22 environment:

```bash
npm ci --include=dev
npm run build:hosting
npm prune --omit=dev
```

`build:hosting` checks frontend TypeScript and generates `dist/` (frontend) and `dist-server/` (backend). Development dependencies must be installed for the build even when `NODE_ENV=production` is already configured.

Configure the production database, admin/session secrets and an absolute persistent `UPLOADS_DIR` in the hosting environment panel, then initialize:

```bash
npm run db:migrate:prod
npm run db:seed:prod
npm run images:migrate:prod
```

Set `NODE_ENV=production`. In the Node app manager, use the **repository root** as the application root and **`dist-server/index.js`** as the startup file. Restart the application through the panel. On a generic Node server, start it with `NODE_ENV=production npm start` and keep that process running.

Express serves the built **`dist` folder**, API and uploaded images under the same domain. Keep uploaded files outside the Git checkout on hosting and include them with database backups. Git transfers code; local images/database data are transferred separately.

Deploy from `main`. After the one-time Veridyen and GitHub SSH setup, a push to `main` runs the build check and deploys to `/home/tugbasim/tugba-app`. The server then runs database and image migrations, restarts Passenger and checks `/api/health`. The production seed is only for initial setup and is not repeated on every push.

For GitHub Actions, set the `VERIDYEN_HOST`, `VERIDYEN_USER`, `VERIDYEN_SSH_PORT`, `VERIDYEN_SSH_PRIVATE_KEY` and `VERIDYEN_SSH_KNOWN_HOSTS` secrets. Use a dedicated SSH login key, and verify the server's host key before storing its known-hosts line. A private repository also needs a separate read-only GitHub deploy key on the server so `git fetch origin main` works. Confirm the server's Node 22 activation path, `dist-server/index.js` startup file, and that production DB settings are available to non-interactive SSH commands (exported or in a server-only `.env`). Keep `UPLOADS_DIR` outside the checkout and back up the database and uploads before the first automatic migration. The workflow and server script are in `.github/workflows/deploy-production.yml` and `scripts/deploy-production.sh`; the [deployment runbook](docs/superpowers/deployment.md) covers application configuration and manual recovery.

## Local testing

The development frontend uses http://localhost:3000 and proxies API requests to port 3001. The production-style local setup uses http://localhost:3100. See [local testing](docs/superpowers/local-testing.md) and [current Claude/Codex handoff](docs/superpowers/backend-handoff.md).

Security assessment: [local audit, 2026-10-10](docs/security/2026-10-10-audit.md). Newsletter signup and unsubscribe use Gmail-delivered, expiring, single-use verification links. Configure the server-only Gmail App Password variables described in the [deployment runbook](docs/superpowers/deployment.md) before starting production.

For security regression checks on Node 22, run `npm run test:security`. This requires the existing, migrated local test database. It runs each test file in a transaction that is rolled back on disconnect and verifies existing rows are unchanged. It excludes `db.test.ts`, which invokes migrations. Test inserts can advance auto-increment counters. It does not reset or migrate a database. With the frontend on port 3000 and API running, `node scripts/security-smoke.mjs` runs 18 non-destructive localhost checks. Development listeners now bind to loopback only.
