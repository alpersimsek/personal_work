# Backend implementation handoff

Updated: 2026-09-17 by Codex.

## Current owner priority

Local user testing comes before hosting. Completed app is running at http://localhost:3100 with development API on 3101. Use `docs/superpowers/local-testing.md` for login location, walkthrough and restart commands. Development migrations/seed and browser login/logout readiness checks passed. No blog fixtures were added. Wait for local testing results and address them before live deployment.

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

The frontend now uses centrally persisted posts and server-verified cookie sessions. Client admin credential env variables and localStorage-era JSON import/export are removed. Image formatting remains unchanged. Subscriber signup remains backend-only; signup UI, consent wording and mailing-list provider remain deferred.

## Latest validation

Node 20.20.2: server tests 36/36, frontend TypeScript, backend compilation and frontend production build passed. Chromium walkthrough covered login/create/edit/public visibility/draft toggles/persisted likes/delete/logout/access rejection and API error feedback without runtime exceptions.

A clean npm ci --omit=dev artifact was tested without TypeScript or tsx: compiled migrations/seed and repeat seed, production startup, real homepage/API boundary, auth cookie attributes, blog operations and subscriber consent/listing all passed against an isolated temporary MariaDB database. Database/grants/server were cleaned up. Provider HTTPS/Passenger/proxy behavior remains untested until actual hosting access exists.

## Operational notes

- Build with development dependencies before pruning, or upload locally built dist/dist-server plus manifests and install runtime dependencies on the host.
- Production DB commands are `npm run db:migrate:prod` and `npm run db:seed:prod`; do not invoke TypeScript scripts after omitting development dependencies.
- Node startup honors PORT, then API_PORT. Use HTTPS in production for Secure cookies.
- requireAuth verifies the token; requireAdmin rechecks current database user/role. Both admin routers use both middleware functions.
- Seeds are idempotent and do not update an existing admin's password.
- dist-server and .superpowers are ignored local outputs; committed reports live under docs.
- Existing large-bundle warning/profile-image size remain; no independent agent review was performed.

Complete real deployment and live acceptance checks, then update task-9-report.md and progress.md. Do not mark live deployment complete from the local smoke test.
