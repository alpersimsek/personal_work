# Production deployment runbook

Status: prepared locally; live deployment awaits a purchased hosting account, domain, and access details.

Use the backend worktree branch `worktree-backend-implementation`. `main` does not yet include these backend changes. Node 22 is specified in `.nvmrc` and package engines. The app needs a MariaDB database and same-origin HTTPS frontend/API.

## Deployment flow selected by the owner

Pull source from GitHub and build on the hosting server. The production Node backend serves the generated dist frontend, /api endpoints and persistent /uploads images on the same domain. Set the Node application root to the repository root and startup file to dist-server/index.js; dist is the frontend asset directory served by Express, not a separate Node application root. No Vite development/preview server is needed in production.

Deploy the reviewed worktree-backend-implementation branch from GitHub; main still contains the earlier app. Clone the deployment branch:

```bash
git clone --branch worktree-backend-implementation git@github.com:alpersimsek/personal_work.git tugba-app
cd tugba-app
```

For a private repository, configure a read-only deploy key first using the GitHub-based deployment section below. Use the hosting account’s Node-enabled terminal and Node 22 as currently specified by this repository. Configure the production environment and MariaDB before database commands.

## Build and install on hosting

```bash
npm ci --include=dev
npm run build:hosting
npm prune --omit=dev
```

Explicit --include=dev is required even if the hosting shell already has NODE_ENV=production, because the build needs TypeScript and other development dependencies. build:hosting checks frontend TypeScript, builds dist, and compiles the backend/migrations into dist-server. Generated folders are ignored by Git and created on the hosting machine. If CloudLinux’s managed node_modules layout requires the panel’s installer, use its supported installation flow with development dependencies included before building.

Keep production secrets in the hosting environment panel, not in Git. Never copy local development credentials to hosting. Initialize the database using the compiled commands below, then start/restart through the Node app manager. On a generic server without that manager, the equivalent command from the repository root is:

```bash
NODE_ENV=production npm start
```

The host must keep that process running. Production environment enables Express static serving from dist; npm start launches dist-server/index.js.

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
ADMIN_PASSWORD=<new production admin password, 12+ characters>
UPLOADS_DIR=/home/<cpanel-user>/app-data/tugba/uploads
```

Use `PORT` if supplied by the host, or set `API_PORT` according to the host's app manager instructions. Startup prefers `PORT`, then `API_PORT`, then 3001. Generate a fresh JWT secret with `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`. Production must use HTTPS because the session cookie is Secure.

### Session security

- The server refuses to start if `JWT_SECRET` is missing, shorter than 32 characters, repetitive, or still the example placeholder, so a weak secret can never go live silently.
- Tokens are HS256 only, carry just the user id and a session version (no name or role), and expire after 12 hours. Issuer, audience, lifetime and every claim are checked on each request, and the user's role is always read from the database.
- The session cookie is `HttpOnly`, `Secure`, `SameSite=Strict` and, in production, named `__Host-session` so a sibling subdomain cannot plant one. Logging in on a `www` or other subdomain would not receive it; serve the site and API from the same host.
- Logging out bumps the user's `session_version`, which kills the token everywhere, even a copied one. Bump it the same way (`UPDATE users SET session_version = session_version + 1`) after a password change or a suspected leak.
- To rotate the secret without signing the admin out: set `JWT_SECRET_PREVIOUS` to the old value, `JWT_SECRET` to a new one, restart, and remove `JWT_SECRET_PREVIOUS` after 12 hours. To force everyone out at once, just change `JWT_SECRET`.
- Run `npm run db:migrate:prod` after deploying this version: it adds the `session_version` column.

Set the application startup file to `dist-server/index.js`; verify the chosen host's Node app manager accepts this ESM entry. If it requires a provider-specific launcher, adapt and validate that after access is available. Do not guess a reverse-proxy trust setting; configure it only against the provider's actual proxy setup and verify rate limiting.

## Initialize the database

With the app's production environment active in its terminal:

```bash
npm run db:migrate:prod
npm run db:seed:prod
npm run images:migrate:prod
```

These commands run compiled JavaScript and need no `tsx` or TypeScript compiler. Migration records keep stable original `.ts` names in both source and compiled runs; a locally migrated database can be imported without renaming its migration history. The seed only creates an admin if that username does not already exist; changing ADMIN_PASSWORD and reseeding does not rotate an existing user's password. To change a password, run `npm run admin:set-password` locally or `npm run admin:set-password:prod` on the host: it asks for the new value at a hidden prompt (or reads `NEW_ADMIN_PASSWORD`), stores its hash and signs the account out everywhere.

### Admin password policy

The seed and the password tool both refuse a password that is shorter than 12 characters, has no digit or symbol, contains the username, is very repetitive, or is one that has been made public. `UlkuTe2391!`, the password that once sat in the client bundle and is still in the repository's commit history, is on that list: treat it as compromised and never use it anywhere. Use a fresh, unique password in production. Do not run `db:test:reset` in production.

Restart the app through the hosting control panel after environment or code changes.

## Live acceptance checks

- Homepage and blog load; `/api/health` returns `{"status":"ok"}`.
- Unknown `/api/...` returns a JSON 404, never HTML.
- Login succeeds over HTTPS and cookie is httpOnly, Secure, SameSite=Lax.
- Create/edit a temporary post, verify publicly in an independent logged-out session, toggle draft/public, like it, and delete it.
- Logout prevents subsequent admin API access; public pages show login controls.
- Subscriber endpoint rejects absent consent and invalid email; valid signup persists consent time; duplicates return 409; admin listing requires an admin session.

Enable provider backups for both MariaDB and the persistent UPLOADS_DIR folder; verify both can be recovered together. Veridyen advertises weekly JetBackup with three retained copies, so confirm database/file coverage and any daily-backup option with support. Signup form placement, consent wording, and mailing-list provider integration remain separate deferred work.

## Disk image storage

Set an absolute UPLOADS_DIR outside the Git checkout/build directories, owned and writable by the application account (no 777 permissions required). The app creates its blog subfolder. Do not expose the checkout itself via the web document root; the Node app serves only dist and validated image paths. New images use the hosting disk quota; database rows contain only references. Existing external images stay external.

When moving local posts to hosting, transfer the local uploads/blog files into the host’s UPLOADS_DIR/blog along with the matching database data. Git does not transfer uploaded images. If the imported database still contains data-URL covers, run images:migrate:prod with the production DB and UPLOADS_DIR configured. It is safe to rerun, keeps timestamps/counters/status unchanged, and preserves failed rows for retry. Keep files through code rollback as well as upgrades. Post deletion/image replacement currently retains files to protect shared references; review orphan storage manually before deleting anything.

Add live checks: upload an admin cover, save the post, confirm an independent browser can load its /uploads/blog URL, restart the app, and confirm the image still loads. Confirm post responses contain paths rather than base64.

## GitHub-based deployment

Veridyen advertises cPanel and Terminal. cPanel supports cloning/pulling GitHub repositories through Git Version Control or an enabled terminal; confirm these features for the purchased account. For a private repository, configure a read-only GitHub deploy key using the host’s SSH/Terminal access. No personal token should be committed or embedded in a clone URL.

Use GitHub repository alpersimsek/personal_work, deployment branch worktree-backend-implementation and release commit hosting_ready. Clone into a private app directory, select that deployment branch, and point the Node app manager at that directory with startup dist-server/index.js. Deployment itself still awaits hosting access.

From the app’s Node-enabled terminal, with production database/environment variables active, updates follow this sequence:

```bash
git pull --ff-only
npm ci --include=dev
npm run build:hosting
npm prune --omit=dev
npm run db:migrate:prod
npm run images:migrate:prod
```

Use the panel’s dependency installer if its CloudLinux Node environment requires it. Restart through the Node app manager and run live acceptance checks. The app’s production environment variables must be active for database commands. UPLOADS_DIR remains outside the checkout and is never removed during builds. Keep secrets in the host’s environment panel. This is manual Git deployment; automatic deployment is not configured.

Sources: [Veridyen Node.js hosting](https://www.veridyen.com/nodejs-hosting), [cPanel Git Version Control](https://docs.cpanel.net/cpanel/files/git-version-control/), [private repository deploy keys](https://docs.cpanel.net/knowledge-base/web-services/guide-to-git-set-up-access-to-private-repositories/).

Node 22 replaces the earlier Node 20 target after hosting-readiness review. Node 20 is end-of-life; Node 22 is supported LTS. Select Node 22 for both build and app runtime. Source: [Node.js release status](https://nodejs.org/en/about/previous-releases).

## Newsletter consent (KVKK)

- The privacy notice and consent wording live in `src/legal/kvkk.ts` and are served at `/kvkk`. `KVKK_VERSION` there must equal `CURRENT_CONSENT_VERSION` in `server/config/consent.ts` (a test fails otherwise). Every sign-up stores that version in `subscribers.consent_version`, together with `consent_at`, as proof of which wording the person agreed to. Bump both whenever the text changes.
- Fill in `DATA_CONTROLLER.address` in `src/legal/kvkk.ts` if a postal address should appear in the notice.
- Have a lawyer review the notice before the first send: the legal bases, the retention wording and, once a sending service is chosen, cross-border transfer (KVKK article 9) if that service stores data abroad.
- Before sending any newsletter every message needs a working, free unsubscribe link (Law 6563 and its regulation), and the sender may need to be registered with İYS. The site has an "Bültenden çık" button (`POST /api/subscribe/unsubscribe`) that marks `subscribers.unsubscribed_at`; **never mail a row where `unsubscribed_at` is set**. Point the unsubscribe link in each message at the site (or use the mailing-list service's own), and keep the two lists in sync. Signing up again clears `unsubscribed_at` and records the new consent.
- Run `npm run db:migrate:prod` on deploy: it adds `users.session_version` and `subscribers.consent_version`.
