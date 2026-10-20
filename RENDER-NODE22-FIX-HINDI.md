# Render Node.js 26 / better-sqlite3 build fix

## Why the build failed
The build log shows Node.js `v26.12.0` and `better-sqlite3` `11.10.0` failing in `node-gyp`. The old `package.json` allowed any Node version `>=20`, so Node 26 was eligible. A `NODE_VERSION` environment variable in `render.yaml` does not reliably pin Render's runtime version.

## Files to replace/add
1. Replace the project's root `package.json` with the supplied `package.json`.
2. Add `.node-version` at the same root level. Its contents must be `22.16.0`.
3. Replace root `render.yaml` with the supplied `render.yaml`.

All three files must sit beside `backend/`, `frontend/`, `admin/`, and `tests/` in the deployed project root. Do not upload these files into a separate nested directory unless you also set that directory as Render's Root Directory.

## Then redeploy
Commit/push the changes to GitHub and trigger a new deploy. Confirm the build log reports Node `v22.16.0` (or Node 22.x) before `npm install` runs.

## Testing status
The supplied JSON parses, the YAML parses, and `.node-version` contains a valid version string. Full dependency installation and the Render deployment cannot be claimed as tested from this environment; the original failure specifically requires confirming the new Render log uses Node 22 and that `better-sqlite3` installs successfully.
