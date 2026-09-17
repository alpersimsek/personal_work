# Task 13 report: GitHub pull and build on hosting — Codex

Date: 2026-09-17
Status: complete for deployment preparation. Actual hosting deployment remains Task 9 and requires hosting access and a published source branch.

## Owner-selected deployment

The owner wants to fetch source from GitHub, build on the hosting machine and serve dist there. Added npm run build:hosting (frontend TypeScript check, Vite dist build, backend/migration compilation to dist-server). Updated README, production runbook, plan and handoff to make server-side builds the selected flow, including initial clone and subsequent pull commands.

Install with npm ci --include=dev before building even under NODE_ENV=production, then optionally prune development dependencies. Configure production environment variables/MariaDB and persistent UPLOADS_DIR, run compiled DB initialization/image conversion, and restart through the Node manager. Repository root is the Node application root; dist-server/index.js is its startup file. Existing production Express serving delivers dist assets/SPA and API/uploads on one origin. No development/preview server or separate frontend process is needed.

Uploads remain outside the hosting Git checkout and require separate transfer alongside local database data. Provider backups must cover both. Source branch worktree-backend-implementation remains local/unmerged/unpushed and must be published before the server can clone it. Private GitHub access uses a read-only deploy key; actual provider ESM/Passenger/proxy setup is still verified after access is available.

## Validation

Node 20.20.2 npm run build:hosting passed: frontend TypeScript, frontend production build and backend compilation. Existing frontend size warning remains. A temporary server using the compiled production entry served the real dist homepage and referenced JS asset, SPA fallback and API health/JSON 404 boundary; repository package.json was not exposed as a static file. No database writes, and the temporary process was stopped.

No application behavior or dependency changed. The functional suite last passed 43/43 in Task 12; it was not rerun for the package-script/documentation change. git diff whitespace check passed. Persistent local frontend/API remain on 3100/3101.

## Handoff

Owner-selected GitHub/server-build flow is concrete and documented. Continue local owner acceptance and publish/deploy the reviewed branch once hosting is available; Task 9 is not marked complete. No remote push, merge, purchase or live deployment performed. Source/report changes committed locally; Claude-local progress and report mirror updated.
