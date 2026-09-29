# CampusConnect

A CHARUSAT campus community project built with Next.js, React, MongoDB, and Google sign-in. The application lives in `cc2/`.

## Run locally

Use Node.js 22 LTS or newer and npm:

```sh
cd cc2
npm ci
```

Create `cc2/.env.local` using `cc2/.env.example`. Set your MongoDB connection, Google OAuth credentials, `NEXTAUTH_URL`, and `NEXTAUTH_SECRET`. Set `UPLOADTHING_TOKEN` to enable uploads. Redis is optional; leave `REDIS_URL` unset if you are not running Redis.

```sh
npm run dev
```

Open http://localhost:3000. The landing page, posts, resources, events, and jobs can be browsed publicly. Personal features require a CHARUSAT Google account and a completed profile. Configure the Google OAuth callback as `http://localhost:3000/api/auth/callback/google` for local development.

The shared MongoDB client preserves the database selected by your connection URI (the driver uses `test` when the URI has no database). `MONGODB_DB` can explicitly override it. Some existing quiz routes use `campusconnect`; no existing data is moved by these changes. Environment files are ignored by Git. Never commit credentials or place secrets in `next.config.js`'s `env` field.

## Checks and production

```sh
npm run test
npm run typecheck
npm run lint
npm run build
npm start
```

The repository root forwards these commands to `cc2`. Use a production build when measuring performance: the development server compiles pages on demand.

## Reliability improvements

- Server-rendered landing page with responsive layouts, direct feature links, and no continuous animation.
- On-demand navigation dialogs and optional UI; no onboarding overlay on login or the landing page.
- Concurrent dashboard requests and database counts, quiet background refresh, cancellation, and a retry message.
- Upcoming events queried from the signed-in user's joined events and RSVPs, sorted by date.
- Bounded pagination and one batched author lookup for each resource page.
- Lazy shared MongoDB connections and optional Redis caching that fails quickly when unavailable.
- API authentication failures return JSON. Protected page redirects preserve their destination.
- Search debounces input, cancels stale requests, escapes regex input, and returns summaries without quiz answers.
- The service worker caches only immutable assets and an offline fallback. It never stores API responses or personalized HTML, and removes the old app caches when activated.
- Type checks and linting run during builds. Regression tests cover pagination, request handling, and offline caching behavior.

Live OAuth, uploads, and authenticated write workflows need valid service credentials and a signed-in user to test end to end.

Run `node --env-file=.env.local scripts/check-connection.mjs` from `cc2` for a read-only database connection check.
