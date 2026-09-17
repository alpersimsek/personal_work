# Task 8 report — Codex

Date: 2026-09-17
Status: complete.
Implementation commit: `ce051b4`.

Auth/blog services call same-origin API endpoints with cookie credentials for admin operations. Removed client-side admin credential env variables and localStorage session/blog persistence. Existing formatCoverImage canvas function is retained unchanged. Removed JSON backup/import handlers and buttons from both admin interfaces.

Updated every service call site, including App, homepage BlogSectionHome, and BlogPostModal omitted from the plan's file list. Post selection now fetches current data by slug, registering views on the server. Added cancellable public loads, loading/empty/error states, save/like pending protection, and async mutation failure feedback. Cover/text fields get null-safe defaults. API_PORT config now also controls the Vite proxy, supporting isolated test ports.

Validation:
- npm run lint passed.
- npm run build passed (also tested on Node 20.20.2).
- npm run build:server passed.
- Server suite passed 36/36 on Node 20.20.2.
- Chromium browser walkthrough passed: login/admin list; create/public visibility in independent logged-out context; edit; draft/public toggles; persisted likes after reloading and reopening; server views; no localStorage session/posts; delete; logout; unauthenticated admin API 401; public login controls restored; zero browser runtime exceptions.
- Browser error-path walkthrough passed: failed save shown, editor content retained and button re-enabled; homepage/public-list API errors visible; no unhandled exceptions.
- git diff --check passed.

Browser tooling was used from an existing external Playwright installation with temporary scripts, not added as a project dependency or frontend framework. Smoke database was the existing MariaDB test database; temporary test posts were deleted. No production data was touched. The initial smoke harness needed disambiguated duplicate button selectors, absolute request URLs, and a wait for homepage data after reload; all corrected and the final full run passed.

Existing large-bundle warning/profile-image size remain. Legacy modal variants were converted and typechecked; active page flows received the browser walkthrough. Task 9 is next; hosting/domain/access details are still outstanding. No main merge or live deployment.
