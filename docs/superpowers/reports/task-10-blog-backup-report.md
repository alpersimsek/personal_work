# Task 10 report: Blog backup and restore — Codex

Date: 2026-09-17
Status: complete. Additional owner request after tasks 1–8; supersedes the original plan's exclusion of JSON backup/import.

## Behavior

- Admin-only GET /api/admin/blog-backup downloads a versioned JSON backup including published posts, drafts, full content, cover images, tags, author/category/read time, likes/views, and creation/update timestamps. Excludes database IDs and all users/subscribers/credentials. Cache-Control is no-store.
- POST /api/admin/blog-backup/preview validates the uploaded backup and reports create/update/published/draft counts without writing.
- POST /api/admin/blog-backup/restore validates the whole file and restores in a single database transaction. Matching slugs are updated while keeping current IDs, missing posts are added, and unrelated posts are preserved. It does not delete posts absent from the backup. Database failure rolls back earlier writes.
- Legacy browser-exported BlogPost[] backups are supported; camelCase fields are normalized, browser IDs/date labels ignored, and duplicate slugs rejected.
- Restore/preview accept up to 50 MB after authentication and current admin-role verification. Malformed/oversized JSON returns consistent 400/413 JSON errors.
- Active frontend admin page has Blog Yedekleme controls, actual file download, accessible file input, server-validated preview, explicit Geri Yükle/Vazgeç controls, pending/error/success feedback, refresh after restore, and cleared stale editor state. Empty restores are disabled. Legacy unused admin modal was not extended.

## Validation

Node 20.20.2:
- npm run test:server passed 46/46, including 10 backup-specific tests.
- npm run lint passed.
- npm run build:server passed.
- npm run build passed; existing large-bundle/profile-image warning remains.
- Whitespace checks passed using git -c core.whitespace=cr-at-eol diff --check.

Backup tests cover no-session/user-role access rejection, complete export metadata/download headers, preview without mutations, restore round trip with unrelated-post preservation and existing ID stability, repeated restore, malformed/unsupported/invalid/duplicate files, legacy imports, empty no-op, forced database failure/rollback, 16 MB preview accepted, and >50 MB upload rejected.

Server test files now run sequentially because backup and post suites mutate the same throwaway blog table. Development database was not reset or restored by automated tests.

Chromium walkthrough against isolated test API/frontend ports 3111/3112 passed: actual JSON download; published/draft/metadata/image/stat retention; preview/cancel; update/add restore and UI refresh; unrelated post preservation; invalid/unsupported files and empty restore; legacy import; download/restore failure feedback and successful retry; 375px viewport fit; zero browser runtime exceptions. Temporary test posts were removed and isolated servers stopped. No project browser framework/dependency was added.

Actual running localhost:3100 was also checked with Chromium: configured admin login, new controls, JSON download and server preview/cancel passed without modifying development blog data.

## Handoff

The owner tests locally before hosting. App remains on localhost:3100, development API 3101. Running development API was restarted explicitly because the mounted drive's watch events had not updated it; polling enabled for the restarted watcher. Reports and current handoff updated. Changes remain in worktree-backend-implementation, not merged into main or deployed.

Limits: restore merges by database slug key rather than replacing the complete blog table. Export/restore covers blog posts only. Upload limit is 50 MB. Do not remove these operations using the older plan's instructions: the owner explicitly requested them in this continuation.
