# Local testing before hosting

Updated: 2026-09-17. The owner wants to test locally before moving to hosting.

## Open the completed app

Frontend: http://localhost:3100
API health through frontend proxy: http://localhost:3100/api/health
Database viewer: http://localhost:8080

Use port 3100 for the completed backend version. Existing processes on ports 3000/3001 serve the earlier app. The completed code is in `.claude/worktrees/backend-implementation`, branch `worktree-backend-implementation`, and is not merged into main.

Admin credentials are `ADMIN_USERNAME` and `ADMIN_PASSWORD` in this worktree's `.env`; they were checked successfully without changing them. Do not use the old browser credential variables from the main checkout.

The development database has been migrated and the admin seeded. An empty public list is expected until a published post is created. Blog changes persist in MariaDB and are shared between browsers.

## User walkthrough

1. Open the site, select **Tüm Yazıları İncele**, then **Yazar Girişi**.
2. Log in using the worktree `.env` credentials.
3. Select **Yeni Makale Yaz**, enter title/summary/content and save.
4. Open http://localhost:3100 in a private browser window and confirm the post appears publicly.
5. Edit the post and check the updated content in the private window.
6. Select **Taslağa Al**, confirm the post disappears publicly, then **Yayınla** to restore it.
7. Open the article, select **Faydalı Buldum**, reload/reopen it, and confirm the count persists.
8. Delete the temporary post and confirm it disappears.
9. Log out and verify the admin panel asks you to log in again.

## Disk-backed blog images

In the admin editor, choose a PNG/JPG/WebP cover. The browser keeps the existing 1200×675 crop/compression and uploads a JPEG to the authenticated image endpoint. Confirm the preview loads, then save the article and view it independently. Images now live in this worktree’s ignored uploads/blog folder; post records contain /uploads/blog paths, not image bytes. Upload failure preserves the previous cover and allows retry; saving is disabled until upload completes. External HTTP(S) image links still work.

Default local storage is ./uploads. Set UPLOADS_DIR to an absolute writable directory to move storage; move existing files too. Vite proxies /uploads to the development API. Do not remove this folder during builds/restarts, and do not expect Git to carry image files to hosting. Deleted/replaced post images remain on disk to protect shared references.

Legacy database covers can be converted safely from the worktree root:

```bash
NODE_ENV=development npm run images:migrate
```

This changes only embedded cover-image references after writing each file, preserves post metadata, and can be rerun. Current local database had no embedded covers to convert; the migration/retry behavior was tested in an isolated database. Restarting the API preserves uploaded images.

## Backups

Application backup/restore controls are removed at the owner’s request. Hosting-provider backups will be used after deployment; configure them during hosting setup, covering both MariaDB and the persistent uploads directory.

Also try the homepage sections, themes, mobile viewport, and WhatsApp consultation flow. Subscribers are backend-only for now; there is no signup form in this implementation.

## Restart commands

From the main workspace:

```bash
cd /mnt/e/Tugba/personal_work/.claude/worktrees/backend-implementation
nvm use 20
docker compose -p personal_work up -d mariadb adminer
NODE_ENV=development npm run db:migrate
NODE_ENV=development npm run db:seed
NODE_ENV=development npm run images:migrate
```

Then use two terminals in that same worktree (run `nvm use 20` in each):

```bash
NODE_ENV=development API_PORT=3101 CHOKIDAR_USEPOLLING=true npm run dev:api
```

```bash
NODE_ENV=development API_PORT=3101 npm run dev -- --port 3100 --strictPort
```

`-p personal_work` reuses the already-running database project's volume. Do not reset the development database to test the UI. The separate automated suite uses the `_test` database:

```bash
npm run test:server
npm run lint
```

## Readiness evidence

MariaDB is healthy. Development migrations and seed passed. Frontend-proxied API health and public listing passed. Chromium checked homepage/public blog/admin login/admin listing/logout with no runtime exceptions and no changes to blog data. Latest automated suite passed 43/43 on Node 20.

Hosting work is deferred until local testing is completed and the owner confirms readiness. Record findings here or in the handoff, fix reported issues, and only then proceed to the production deployment runbook.
