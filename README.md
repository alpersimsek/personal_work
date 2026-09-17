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

The completed local app uses http://localhost:3100. See [local testing](docs/superpowers/local-testing.md) and [current Claude/Codex handoff](docs/superpowers/backend-handoff.md).
