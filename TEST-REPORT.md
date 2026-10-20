# Test Report — Noor Islamic Journal CMS

Date: 2026-10-20

## Results from this test campaign

| Check | Result | Scope / notes |
|---|---|---|
| JavaScript syntax | PASS | All 23 project JavaScript files checked with Node.js `--check` |
| Static project tests | PASS | 8/8 tests: assets, frontend/API route contracts, Render build/test commands, Smart Paste safety contract, request-size limits, WCAG AA admin text contrast, security middleware/route guards and no real secret committed |
| Dependency-free backend unit tests | PASS | 5/5 tests: article ID validation, API 404 responses and safe error handling |
| Browser UI tests | PASS | 29/29 checks in Chromium using the real frontend/admin files and a mock API; covers home/list/search/article page, login states, create/edit/publish/draft/delete, preview, Smart Paste, HTML import, file-size limit, backup download, logout and mobile layout |
| Browser JavaScript errors | PASS | 0 uncaught page errors |
| Browser HTTP errors | PASS | Only expected 401 responses for logged-out session and incorrect login; no unexpected HTTP errors in the mock-browser run |
| Smart Paste formatting regression | FIXED + PASS | Inline CSS bold/italic/underline now becomes semantic formatting; regression test confirmed underline preservation |
| HTML import isolation | PASS | Script/image elements are removed; test confirmed a removed image URL is not requested during import |
| Mobile layout | PASS | Home page, admin login and authenticated admin workspace had no horizontal overflow at 390px viewport width |
| HTML files / CSS / config | PASS | All four HTML pages parsed; CSS brace counts matched; `package.json` parsed as JSON and `render.yaml` as YAML |
| Relative JS imports | PASS | Every relative JavaScript import points to an existing file |
| Full `npm test` suite | BLOCKED | Test runner exits before API tests because `express` and `slugify` are absent; this follows the failed dependency install, not a confirmed assertion failure |
| Dependency installation | BLOCKED | A 15-minute recovery window completed with 15 install attempts; all failed at DNS resolution for `registry.npmjs.org` (`EAI_AGAIN`). Direct registry-IP and alternate npm mirror attempts also failed |
| SQLite schema smoke test | PASS (limited) | Extracted schema executed with Python SQLite; tables/indexes, published-vs-draft filtering, unique slug, status constraint and session insert/revoke verified; this is not the actual better-sqlite3 repository integration |
| Real API/SQLite integration | NOT VERIFIED | `tests/admin-workflow.test.js`, `tests/article-service.test.js` and `tests/routes.test.js` require npm dependencies which could not be installed in this environment |
| Live Render deployment / disk persistence | NOT RUN | Requires the user's Render account and deployed service |

## Fixes made after tests exposed issues

- Fixed Smart Paste / HTML import so inline CSS underline formatting is preserved as `<u>` instead of being lost.
- Changed HTML parsing to an inert `<template>` before cleanup; imported script, image and other active/embed elements are removed before content enters the editor.
- Raised the JSON/form request parser limit to 3 MB so a valid HTML import capped at 2 MB can still be saved with its JSON metadata.
- Darkened admin muted text and editor placeholder colors. Automated contrast checks now report at least 4.5:1 for small text on tested backgrounds.
- Added a local SVG favicon to the public pages and Admin Studio.
- Updated the Render build command so deployment runs `npm run check` and `npm test` after dependency installation; a failing test will stop the build rather than silently deploying.

## Important test boundary

The 29 browser tests exercise the real HTML, CSS and browser JavaScript, but API responses are mocked. They are **not** proof that Express routes, SQLite persistence, server-side HTML sanitization, or Render persistence passed end-to-end. Those checks remain blocked until dependencies can be installed and the service can be deployed.

## Commands for a network-enabled environment

1. `npm install --no-audit --no-fund`
2. `npm run check`
3. `npm test`
4. `npm start`
5. Verify `/api/v1/health`, admin login, article CRUD, public draft hiding, SQLite backup, and data persistence after a Render redeploy.
