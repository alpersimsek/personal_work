# Task 9 report — Codex

Date: 2026-09-17
Status: local deployment preparation complete; live deployment pending external hosting/domain/access.

No production hosting account or access configuration was available. A request for provider/domain/access details was sent; no answer arrived during this work. No live provisioning, upload, restart, or production acceptance check has been performed.

Prepared docs/superpowers/deployment.md with corrected build/install order, local-artifact and server-build alternatives, environment/startup setup, compiled migration/seed commands, and live acceptance checks.

Fixed deployment blockers in the original checklist:
- TypeScript is a development dependency, so build before pruning development dependencies, or upload locally compiled artifacts.
- Added db:migrate:prod/db:seed:prod commands using compiled JavaScript rather than tsx.
- Knex discovers only the appropriate .ts or .js files based on the config module's extension, so compiled migrations/seeds actually run.
- DB_NAME is required rather than silently constructing an undefined database name.
- Startup honors host-provided PORT before API_PORT.
- Generated dist-server and local .superpowers task logs are ignored; durable reports stay in docs.

Validation on Node 20.20.2:
- Server suite passed 36/36; frontend TypeScript, backend compilation and frontend production build passed. Whitespace check passed with git -c core.whitespace=cr-at-eol diff --check, preserving the existing CRLF package.json/.gitignore line endings.
- Created a separate deployment directory containing package manifests and compiled dist/dist-server, and ran npm ci --omit=dev successfully.
- TypeScript was absent. Vite's optional peer caused tsx to remain despite --omit=dev; removed it only in the temporary artifact and confirmed all operational commands still work without it.
- Created an isolated temporary MariaDB database, applied compiled migrations, seeded admin, and repeated seed successfully.
- Compiled production server passed homepage/health/API-boundary checks, PORT precedence, login/session/logout response checks, Secure/httpOnly/SameSite cookie flags, public post views/likes, admin create/delete, consent persistence and admin listing.
- Temporary database/grants were removed and server stopped. No existing development or production data was modified by deployment smoke checks.

Limits: local API checks exercised cookie flags over loopback HTTP using explicit Cookie headers; actual HTTPS browser behavior, Passenger/ESM compatibility and provider proxy configuration still require real hosting validation. Existing large frontend bundle/profile image warning remains.

Claude resume: obtain purchased hosting/domain/access, follow docs/superpowers/deployment.md, and complete its live acceptance checklist. Update this report and ledger after real deployment; do not mark Task 9 complete based on local checks.

Owner update (2026-09-17): local acceptance testing first, hosting after it is completed. Local app started on frontend 3100/API 3101 with development MariaDB; migrations/seed passed and homepage/API/admin login/logout checked. See docs/superpowers/local-testing.md. Live deployment remains deferred.


## Task 12 deployment amendment (2026-09-17)

Blog images now use persistent UPLOADS_DIR/blog with database paths. Configure storage outside the Git checkout, include files alongside MariaDB in provider backups and validate restart/recovery. Source/compiled image migration commands and manual GitHub/private-deploy-key deployment steps are documented in docs/superpowers/deployment.md. Task 12 tests/builds/browser/compiled runtime checks passed; live deployment remains pending local owner acceptance and hosting access.


## Task 13 deployment preference (2026-09-17)

Owner selected GitHub clone/pull and builds on the hosting server. Use npm ci --include=dev and npm run build:hosting, then compiled DB commands and panel restart. Repo root is the Node app root; dist-server/index.js serves dist and API/uploads in production. Build and compiled real-static-serving smoke passed locally. Actual hosting/published deployment branch remain pending; see task-13-hosting-server-build-report.md and deployment.md.
