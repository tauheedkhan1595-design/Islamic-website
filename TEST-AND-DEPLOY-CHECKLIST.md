# Test and deployment checklist

## Automated checks
- `npm run check` checks JavaScript syntax.
- `npm test` runs article validation/sanitization, health/public routes, admin login/session, article CRUD, draft visibility and SQLite backup tests.
- `render.yaml` runs install, syntax checks and tests during the build, so a failed test stops deployment.
- Browser UI regression tests were run during packaging with Chromium and a mock API. They cover the frontend and Admin Studio; they do not replace server-side integration tests.

## Run locally
1. Install Node.js 20+.
2. Copy `.env.example` to `.env` and set private `ADMIN_SECRET_CODE` and `SESSION_SECRET` values.
3. Run `npm install --no-audit --no-fund`.
4. Run `npm run check` and `npm test`.
5. Run `npm start`; verify `/api/v1/health`, public articles, admin login, create/edit/publish/draft/delete and backup.

## Production verification
- Confirm `DATA_DIR=/var/data` and the persistent disk is mounted at `/var/data`.
- Set a private `ADMIN_SECRET_CODE`; confirm a unique generated `SESSION_SECRET` exists.
- Publish a test article, open it publicly, restart/redeploy, and verify it remains.
- Confirm drafts are not public and download a backup outside Render.

## Environment limitation during this test campaign
The packaging environment could not resolve `registry.npmjs.org`, so dependency-backed API/SQLite tests and a live Render deployment could not be verified here. Do not interpret the successful static/browser tests as proof of backend integration or deployment persistence.
