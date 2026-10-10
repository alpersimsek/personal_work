# Tuğba website

React frontend with an Express API, MariaDB blog/subscriber data, server-verified admin sessions and disk-backed blog images.

## Hosting from GitHub

Clone the published backend deployment branch on the hosting server. From the repository root, using the app's Node 22 environment:

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

For updates, use `git pull --ff-only`, repeat install/build/migration commands and restart. Full instructions, private GitHub deploy keys and acceptance checks: [deployment runbook](docs/superpowers/deployment.md).

Clone `alpersimsek/personal_work` branch `worktree-backend-implementation` for the `hosting_ready` release. `main` still contains the earlier implementation.

## Local testing

The development frontend uses http://localhost:3000 and proxies API requests to port 3001. The production-style local setup uses http://localhost:3100. See [local testing](docs/superpowers/local-testing.md) and [current Claude/Codex handoff](docs/superpowers/backend-handoff.md).

Security assessment and remaining work: [local audit, 2026-10-10](docs/security/2026-10-10-audit.md). Public newsletter changes are temporarily paused until mailbox ownership can be verified; the forms display a contact address and existing subscriber records remain available to administrators.

For security regression checks on Node 22, run `npm run test:security`. This requires the existing, migrated local test database. It runs each test file in a transaction that is rolled back on disconnect and verifies existing rows are unchanged. It excludes `db.test.ts`, which invokes migrations. Test inserts can advance auto-increment counters. It does not reset or migrate a database. With the frontend on port 3000 and API running, `node scripts/security-smoke.mjs` runs 18 non-destructive localhost checks. Development listeners now bind to loopback only.
