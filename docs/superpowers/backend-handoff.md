# Backend implementation handoff

Updated: 2026-09-17 by Codex.

## Current owner priority

Local user testing comes before hosting. Completed app is running at http://localhost:3100 with development API on 3101. Use `docs/superpowers/local-testing.md` for login location, walkthrough and restart commands. Development migrations/seed and browser login/logout readiness checks passed. No blog fixtures were added. Wait for local testing results and address them before live deployment.

Owner selected GitHub pull + build on hosting (Task 13, report docs/superpowers/reports/task-13-hosting-server-build-report.md): use npm ci --include=dev, npm run build:hosting, then compiled DB commands and panel restart. Production Express serves dist; application root remains the repo root, startup dist-server/index.js. Source branch must be published before host clone. See the deployment runbook.

## Resume here

- Worktree: `.claude/worktrees/backend-implementation` relative to the main checkout.
- Branch: `worktree-backend-implementation`; backend changes are not merged into `main` or pushed remotely.
- **Tasks 1–8 are complete. Task 9 is prepared locally but live deployment awaits purchased hosting, domain and access details.**
- Use `docs/superpowers/deployment.md` for the corrected deployment commands and live acceptance checklist.
- Plan: `docs/superpowers/plans/2026-09-17-backend-implementation.md`.
- Spec: `docs/superpowers/specs/2026-09-17-backend-design.md`.
- Durable task reports: `docs/superpowers/reports/task-{4,5,6,7,8,9}-report.md`.
- Claude-local ledger/reports: `.superpowers/sdd/2026-09-17-backend-implementation/`.

## Delivered

| Task | Status | Implementation commit |
|---|---|---|
| 1–3: Express foundation, database, password/JWT helpers | Complete before this continuation | through 5654c06 |
| 4: Server login/logout/session and rate limits | Complete | 5269bbf |
| 5: Public blog/admin CRUD, draft protection and admin roles | Complete | 28673ee |
| 6: Subscriber persistence/consent and admin listing | Complete | 8035113 |
| 7: Production frontend serving and JSON API boundary | Complete | 3034635 |
| 8: All frontend API call sites and async/error handling | Complete | ce051b4 |
| 9: Production deployment | Locally prepared/tested; live hosting pending | see latest branch commit |
| 10: Application backup/restore | Superseded by owner request | 7867a95 (historical) |
| 11: Remove application backup/restore | Complete | 6ab00c4 |
| 12: Disk-backed blog images | Complete | ea0392a |
| 13: GitHub source / hosting-side build flow | Preparation complete; actual hosting remains pending | see latest branch commit |

The frontend now uses centrally persisted posts and server-verified cookie sessions. Client admin credential env variables and localStorage-era JSON import/export are removed. Image cropping/compression remains unchanged; uploaded files now live on disk with database paths (Task 12). Subscriber signup remains backend-only; signup UI, consent wording and mailing-list provider remain deferred.

## Backup decision

Owner requested removal of application backup/restore in favor of hosting-provider backups. Backend endpoints, backup-specific code/tests and admin controls are removed. Task 10 is historical and superseded by Task 11; see `docs/superpowers/reports/task-11-remove-blog-backup-report.md`. Configure provider backups for both database and the persistent uploads directory during hosting setup. Do not reintroduce application backup operations.

## Task 12: Disk-backed blog images

Admin POST /api/admin/images accepts authenticated/current-admin raw PNG/JPEG/WebP files, checks signatures and 5 MB limit, atomically saves content-hash filenames under UPLOADS_DIR/blog, and returns /uploads/blog URLs. The active editor uploads its optimized JPEG before saving; post writes reject embedded data images. External HTTP(S) image URLs remain supported. Vite proxies uploads locally; Express serves them in development/production with nosniff and a JSON 404 boundary.

Run npm run images:migrate locally or npm run images:migrate:prod after compilation to convert legacy covers. Migration is repeatable, preserves post metadata, writes before updating references and protects concurrent edits. Local migration found no embedded covers. Keep uploads out of Git and outside the host checkout via absolute UPLOADS_DIR. Transfer local image files separately if moving local blog data; GitHub carries code only. Files are retained after post deletion/replacement to protect shared references. See docs/superpowers/reports/task-12-disk-blog-images-report.md and the updated deployment runbook for GitHub deployment/private deploy keys. No push/merge/live deployment performed.

## Latest validation

Task 13: npm run build:hosting passed on Node 20 and compiled production startup served the real dist homepage/assets/SPA with healthy API/JSON 404 boundary. No database writes.

Node 20.20.2: server tests 43/43, frontend TypeScript, backend compilation and frontend production build passed. Chromium walkthrough covered login/create/edit/public visibility/draft toggles/persisted likes/delete/logout/access rejection and API error feedback without runtime exceptions.

A clean npm ci --omit=dev artifact was tested without TypeScript or tsx: compiled migrations/seed and repeat seed, production startup, real homepage/API boundary, auth cookie attributes, blog operations and subscriber consent/listing all passed against an isolated temporary MariaDB database. Database/grants/server were cleaned up. Provider HTTPS/Passenger/proxy behavior remains untested until actual hosting access exists.

Disk image browser checks passed against isolated test DB: formatting/upload/preview, upload error/retry and disabled pending save, path-only post persistence, independent public image serving, WebP upload, production assets and mobile fit without runtime errors. Compiled server restart also preserved image serving.

Removal checked in the local admin browser and all three former endpoints return JSON 404. No development blog data was changed.

## Operational notes

- Build with development dependencies before pruning, or upload locally built dist/dist-server plus manifests and install runtime dependencies on the host.
- Production DB commands are `npm run db:migrate:prod` and `npm run db:seed:prod`; do not invoke TypeScript scripts after omitting development dependencies.
- Node startup honors PORT, then API_PORT. Use HTTPS in production for Secure cookies.
- requireAuth verifies the token; requireAdmin rechecks current database user/role. Both admin routers use both middleware functions.
- Seeds are idempotent and do not update an existing admin's password.
- dist-server and .superpowers are ignored local outputs; committed reports live under docs.
- Existing large-bundle warning/profile-image size remain; no independent agent review was performed.

Complete real deployment and live acceptance checks, then update task-9-report.md and progress.md. Do not mark live deployment complete from the local smoke test.
