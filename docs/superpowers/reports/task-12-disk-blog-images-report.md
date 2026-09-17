# Task 12 report: Disk-backed blog images — Codex

Date: 2026-09-17
Status: complete. Owner requested disk image storage in both local/hosting environments and asked about GitHub-based hosting deployment.

## Delivered behavior

- Authenticated/current-admin POST /api/admin/images accepts raw PNG/JPEG/WebP bytes, enforces a 5 MB limit and checks matching file signatures. No new dependency/native build requirement was introduced.
- Images are saved under UPLOADS_DIR/blog with SHA-256 filenames. Temporary files are renamed atomically so public reads never observe partial writes; repeated uploads return the same URL. Client filenames are never used.
- Express serves validated /uploads/blog/<hash>.<extension> URLs in development and production with nosniff, immutable caching and JSON 404 for invalid/missing upload paths. Vite proxies /uploads to the development API.
- Admin editor retains 1200×675 JPEG crop/compression, uploads before assigning the cover path, preserves the old cover on failure and supports same-file retry. Save/editor navigation/image controls are disabled while uploading. File inputs have accessible labels and existing-image upload progress is visible.
- Post create/update now accept only empty values, managed image paths or external HTTP(S) URLs (maximum 2048 characters); embedded image bytes cannot be newly saved to the cover column.
- Added images:migrate and compiled images:migrate:prod commands. Legacy cover conversion processes one row at a time, writes the file before updating its reference, preserves all post metadata and protects concurrent changes with a binary comparison. Failure retains the original failed row; reruns are safe. LONGTEXT remains for backward-compatible conversion, while new stored values are short references.
- Added UPLOADS_DIR to .env.example and ignored uploads/ in Git. Local uploads/blog exists in the worktree. Hosting should use an absolute persistent directory outside the Git checkout.
- Browser testing found existing mobile card overflow; min-width constraints and wrapping metadata fixed it without changing the admin layout.

## Validation

Node 20.20.2: 43/43 server tests passed (seven new integrated image/migration tests), frontend TypeScript check, backend compilation and frontend production build passed. Existing large-bundle/profile-image warnings remain.

New server coverage checks authorization/current admin role, disk bytes/URL-only database persistence, deduplication/new app instance, invalid/spoofed/empty/oversized uploads, embedded/unsafe reference rejection, hidden/path-traversal/missing-file boundaries with production SPA enabled, metadata-preserving/idempotent migration and file-write failure/retry.

Chromium against isolated test DB/API/UI on 3113/3114 passed actual source image cropping/compression and binary JPEG upload, 1200×675 preview loaded through Vite, file persistence, simulated upload error/previous-cover preservation, same-file retry, disabled pending save, URL-only post saving, exact bytes served to independent public visitors, production image/homepage serving, real WebP upload, 375px mobile fit and zero runtime errors. Test-created posts were removed.

Stopped the source test API, restarted a compiled Node-only app using the same upload directory and verified exact existing image bytes. Compiled migration converted an isolated legacy JPEG cover and a second run migrated zero rows; its own test row was removed. Local development images:migrate and images:migrate:prod each found zero legacy embedded covers. No development posts were created, reset or deleted. Running localhost:3100 admin login/listing and backup-removal checks passed; all former backup URLs remain JSON 404. Windows localhost homepage returned 200. Temporary test servers/files were cleaned up.

## GitHub deployment and handoff

Updated durable handoff, specification, plan, local-testing guide and deployment runbook plus Claude-local progress/report mirrors. Runbook explains cPanel Git/Terminal access, read-only private GitHub deploy keys, manual pull/build/migration/restart sequence and persistent uploads outside the checkout. Git transfers code; upload files and matching database data require separate transfer. Provider backups must cover both database and persistent files; verify coverage/recovery during actual hosting setup.

Tasks 1–8 and 11–12 complete; Task 10 superseded. Task 9 awaits owner local acceptance and purchased hosting/domain/access. No remote push, merge into main, automatic deployment or live hosting setup occurred. Provider Passenger/ESM entry/proxy/HTTPS behavior remains pending actual access.

Images are public assets even when used by a draft. Files are deliberately retained after post deletion/replacement to protect shared/pending references; orphan cleanup is not automatic. Preserve uploads through deployments/rollbacks and review unused-file storage before deleting anything. Application backup/restore stays excluded by the latest owner decision.
