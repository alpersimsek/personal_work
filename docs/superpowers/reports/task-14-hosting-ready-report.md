# Task 14 report: hosting_ready review and GitHub source release — Codex

Date: 2026-09-17
Status: code review complete. Source release: hosting_ready.
Repository: https://github.com/alpersimsek/personal_work
Deployment branch: worktree-backend-implementation. main remains separate.

## Review and changes

Fetched origin and confirmed remote main is already contained in the backend branch history. Reviewed production dist/API/upload serving, authenticated admin/image routes, input validation, database configuration, admin seeding and source/compiled commands. No environment secrets, uploads, generated outputs or Claude-local state are tracked; tracked environment template uses sample values only.

Changed .nvmrc and synchronized package/lock engine metadata from Node 20 to Node 22. Node 20 is end-of-life; Node 22 is LTS and is within the host's advertised supported versions. Installed/verified Node 22.23.2 locally and aligned README, current spec/plan, local instructions and hosting runbook. Historical reports retain their original Node 20 evidence. Sources: [Node.js releases](https://nodejs.org/en/about/previous-releases), [Veridyen Node.js hosting](https://www.veridyen.com/nodejs-hosting).

Reproduced a real deployment bug: running compiled migrations against the source-migrated local test database failed with missing .ts migration filenames. Added an anchored migration source that loads the appropriate .ts/.js modules while retaining original .ts migration identities. Local database migration history can now move to hosting without renaming it or trying to recreate existing tables. Kept migration validation enabled. Added a regression test that compiles into a temporary ESM tree, runs the compiled migration CLI twice against the source-migrated test DB, checks unchanged records and verifies source migrations still report no pending work. Test reproduced the failure before the fix and passes afterward.

README/runbook now identify the actual GitHub repository and source deployment branch. Clone that branch, install build dependencies explicitly, run build:hosting, initialize using compiled DB commands and configure Node 22/repo-root application/dist-server/index.js startup. dist stays server-built and uploads remain outside the checkout.

## Validation

Node 22.23.2: 44/44 server tests passed, frontend TypeScript check, frontend dist build and backend compilation passed through build:hosting. npm ci --include=dev dry-run accepted the synchronized lock/manifest. Compiled migrations/seed passed against the existing isolated test database; development image conversion found zero embedded covers. Existing large frontend bundle/profile-image warnings remain.

Compiled production startup served real dist homepage/assets/SPA and API health/JSON 404 without exposing the repository manifest. A clean temporary npm ci --omit=dev artifact was also tested after explicitly removing tsx/TypeScript (Vite's optional peer may retain tsx otherwise): fresh compiled migrations and repeat run, stable migration record names, seed/repeat seed, image migration, production homepage/assets/API, private admin listing and Secure/HttpOnly login cookie all passed. Only an isolated temporary MariaDB database was created; its grants, database, runtime process and artifact directory were cleaned up.

Restarted existing local API/web tmux sessions on Node 22, preserving ports 3101/3100. Chromium on localhost:3100 passed configured admin login/listing and confirmed removed backup operations still return JSON 404 with no runtime errors or development blog writes. Frontend-proxied health and Windows localhost homepage returned 200. git diff whitespace check passed.

## Release and handoff

The owner explicitly authorized pushing to GitHub with commit subject hosting_ready. This source release targets origin/worktree-backend-implementation and includes the completed backend/frontend/disk-image work plus reports. Publication is a normal branch push without a main merge or force update; remote commit identity is checked after pushing and recorded in the local ledger/final response.

Task 9 remains actual hosting deployment: select Node 22, configure production MariaDB/secrets/persistent uploads/domain/HTTPS, verify provider Passenger/ESM/proxy behavior and provider backup recovery. hosting_ready is a reviewed source/build release, not evidence of live hosting deployment. Local acceptance may continue at localhost:3100. Claude handoff, Task 9 amendment, plan/spec and report mirrors are updated; no production infrastructure was changed.
