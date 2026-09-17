# Backend Design: Auth, Blog API, Subscribers

Date: 2026-09-17
Status: Approved (pending final read-through)

## Context

The site (`personal_work`) is currently a fully client-side React/Vite SPA.
Two problems motivate this backend:

1. The blog "admin" login (`src/services/authService.ts`) is client-side
   only — credentials and the check itself ship in the JS bundle, so it
   is not a real security boundary (see prior security review). Blog
   posts also live only in each visitor's own `localStorage`, so
   "publishing" a post doesn't make it visible to anyone else.
2. A new requirement: collect subscriber name/email (with KVKK-compliant
   consent tracking) for a future mailing-list integration.

This spec covers building a real backend so admin login is
server-verified and shared, blog posts are stored centrally and visible
to all visitors, and subscriber signups are persisted for later export
to a third-party mailing-list provider.

## Non-goals

- Sending bulk email ourselves. Subscribers are stored; actual campaign
  sending goes through a third-party mailing-list service (provider
  decision deferred).
- Real user self-registration. The `users` table is shaped to support
  it later, but only a single seeded admin account is created now.
- Object storage for images. Cover images are stored as data-URL text
  in the database (existing `formatCoverImage()` behavior unchanged).
- CSRF token scheme beyond `SameSite` cookie protection — acceptable
  given frontend and API are same-origin in production and there is a
  single low-value admin account.

## Deployment target

Node.js-capable Turkish shared/cPanel hosting (Veridyen or hosting.com.tr
Node.js plans researched separately), using cPanel's Node.js App
Manager (Phusion Passenger) to run a single Node process per app, plus
a MariaDB 10.6+ database provisioned through the same panel. Local
development mirrors this with the Docker Compose MariaDB 10.6 setup
already in the repo (`docker-compose.yml`) and Node 20 (`.nvmrc`).

## Architecture

New `server/` directory, TypeScript, sibling to `src/`:

```
server/
  index.ts               — Express app entry point
  db/
    knexfile.ts           — connection config, reads DB_* env vars
    migrations/           — versioned schema changes (knex migrate)
  routes/
    auth.ts, posts.ts, subscribers.ts
  middleware/
    requireAuth.ts, errorHandler.ts, rateLimit.ts
  repositories/
    usersRepo.ts, postsRepo.ts, subscribersRepo.ts
  utils/
    password.ts (bcrypt), jwt.ts
  validation/
    schemas.ts            — zod schemas per endpoint
```

**Local dev:** Vite dev server (frontend, `:3000`) proxies `/api/*` to
the Express server (`:3001`, run via `tsx watch server/index.ts`),
configured in `vite.config.ts`'s `server.proxy`. Frontend calls
`fetch('/api/...')` identically in dev and prod.

**Production:** the same Express app also serves the built `dist/`
frontend as static files and handles the SPA fallback route, since
cPanel's Node.js App Manager runs one process per app — this is one
deployed app, not two separate services. `npm run build:server`
compiles `server/` to plain JS (`tsc`) so the cPanel startup file
points at compiled JS, not `tsx`/`ts-node`, in production.

**Auth mechanism:** login issues a JWT stored in an httpOnly, Secure,
`SameSite=Lax` cookie — never exposed to JS, never in `localStorage`.
This is the core fix for the original client-side-auth vulnerability:
the password check now happens server-side against a bcrypt hash that
never leaves the server.

## Data model

```sql
CREATE TABLE users (
  id             INT PRIMARY KEY AUTO_INCREMENT,
  username       VARCHAR(50) UNIQUE NOT NULL,
  email          VARCHAR(255) UNIQUE NULL,
  password_hash  VARCHAR(255) NOT NULL,
  role           ENUM('admin','user') NOT NULL DEFAULT 'admin',
  created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE blog_posts (
  id             INT PRIMARY KEY AUTO_INCREMENT,
  slug           VARCHAR(255) UNIQUE NOT NULL,
  title          VARCHAR(255) NOT NULL,
  summary        TEXT,
  content        LONGTEXT,
  category       VARCHAR(100),
  tags           JSON,
  author         VARCHAR(100),
  read_time      VARCHAR(50),
  cover_image    LONGTEXT,                 -- data URL, matches formatCoverImage() output
  published      BOOLEAN NOT NULL DEFAULT true,
  featured       BOOLEAN NOT NULL DEFAULT false,
  likes          INT NOT NULL DEFAULT 0,
  views          INT NOT NULL DEFAULT 0,
  created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE subscribers (
  id               INT PRIMARY KEY AUTO_INCREMENT,
  name             VARCHAR(255) NOT NULL,
  email            VARCHAR(255) UNIQUE NOT NULL,
  consent_given    BOOLEAN NOT NULL,
  consent_at       DATETIME NOT NULL,       -- KVKK audit trail
  unsubscribed_at  DATETIME NULL,
  created_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

`tags` is a JSON array column rather than a join table — no tag-based
browsing/analytics requirement exists today (YAGNI).

Managed via Knex migrations, applied identically to local Docker
MariaDB and production MariaDB.

## API endpoints

Public:
- `GET /api/posts` — published posts, filtered/paginated (`category`,
  `searchQuery`, `page`, `limit` — mirrors current
  `blogService.getPublishedPosts`)
- `GET /api/posts/:slug` — single post, increments `views`
- `POST /api/posts/:id/like` — increments `likes`
- `POST /api/subscribe` — body `{ name, email, consent, honeypot }`;
  `400` if `consent !== true` or email invalid, `409` on duplicate
  email, honeypot field silently no-ops (matches existing booking-form
  pattern in `calendarService.ts`)

Admin (behind `requireAuth`, reads the JWT cookie):
- `POST /api/auth/login` — body `{ username, password }`; rate-limited
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `GET /api/admin/posts` — all posts including unpublished drafts
- `POST /api/admin/posts`
- `PUT /api/admin/posts/:id`
- `DELETE /api/admin/posts/:id`
- `PATCH /api/admin/posts/:id/publish`
- `GET /api/admin/subscribers` — list, for manual export until a
  mailing-list provider is integrated

## Error handling

- Centralized Express error-handling middleware: consistent
  `{ error: "message" }` JSON shape; no stack traces or raw SQL errors
  reach the client in production.
- `400` validation errors, `401` missing/invalid auth, `403`
  insufficient role, `404` unknown resource, `500` unhandled (logged
  server-side only, generic message to client).
- `express-rate-limit` on `POST /api/auth/login` and
  `POST /api/subscribe`.
- Request body validation via `zod` schemas at every endpoint boundary
  — this is now a real trust boundary (untrusted client input reaching
  a server), unlike the previous fully-client-side app.

## Testing

- Node's built-in test runner (`node --test`, via the existing `tsx`
  dependency — no new dependency) for unit tests: password hashing
  round-trip, JWT sign/verify, repository query logic.
- `supertest` (new, small, standard) for endpoint-level tests: login
  flow, auth-gated routes reject without a valid cookie, subscribe
  endpoint rejects missing consent / invalid email / duplicate email.
- Integration tests run against the local Docker MariaDB; a
  `db:test:reset` script re-applies migrations to a throwaway test
  database before the suite runs.

## Open items (deferred, not blocking this build)

- Choice of mailing-list provider for actual bulk sending (Brevo vs
  Mailchimp vs other) — deferred by user request.
- Frontend placement of the subscription signup form and the actual
  KVKK consent wording — deferred to user; consent text needs legal
  review before launch, not drafted here.
- Final choice between Veridyen and hosting.com.tr for production
  hosting — leaning Veridyen per prior review, not yet purchased.
