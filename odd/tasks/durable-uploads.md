# Feature: Durable uploads (Supabase Storage)

## Objective
Uploaded files (images and PDFs) must live in durable object storage instead of the local disk, so they survive Render's ephemeral filesystem and are never lost after a deploy.

## Problem
Uploads were written to `./uploads/**` on the server's disk. Render's disk is ephemeral: every deploy wipes it, so images and PDFs referenced in the database return 404 afterwards. Confirmed in production: a recommendation row pointing at `/uploads/recommendations/image-…png` returned HTTP 404, while the same file existed only on the local machine (it was uploaded while the local backend still pointed at the production database).

## Why
Product request: the images on the site must not disappear.

## Solution
Bucket `uploads` (public) in Supabase Storage, written through the Storage REST API (no new dependency — Node's global `fetch`). The database stores the **absolute public URL**; the frontend already passes absolute URLs through (`getImageUrl` returns `http*` paths as-is).

Verified end-to-end against the dev project: bucket created and set public, `POST /storage/v1/object/uploads/...` uploads, and `GET /storage/v1/object/public/uploads/...` serves without credentials.

## Scope
- NEW `backend/src/storage/storage.service.ts` (+ module) exposing `upload(folder, file)` → absolute public URL, using `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` and `SUPABASE_STORAGE_BUCKET` (default `uploads`). It must throw a clear error when the credentials are missing (no silent disk fallback), and generate the object name itself (`<folder>/<fieldname>-<Date.now()>-<rand><ext>`).
- Swap multer `diskStorage` for `memoryStorage()` and route every upload through `StorageService`, replacing the `/uploads/<folder>/<filename>` string construction in:
  - `backend/src/courses/courses.controller.ts` (image, pdfGuide; pdfs → attachments)
  - `backend/src/patterns/patterns.controller.ts` (imagen, archivo, pdfs)
  - `backend/src/events/admin-events.controller.ts` (image)
  - `backend/src/recommendations/admin-recommendations.controller.ts` (image)
  - `backend/src/lessons/lessons.controller.ts` (pdf)
  - `backend/src/lesson-progress/lesson-progress.controller.ts` (image, evidencia)
  - `backend/src/lesson-comments/lesson-comments.controller.ts` (image)
  - `backend/src/attachments/attachments.service.ts` (builds `/uploads/{courses,lessons,patterns}/<filename>` — must upload instead and return the public URL)
- Keep `main.ts` static serving of `./uploads` so legacy rows with relative paths keep working.
- `.env`: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_STORAGE_BUCKET` (already set for the dev project).

## Out of scope
- Re-uploading files already lost in production (the user re-uploads them by hand).
- Migrating legacy rows to absolute URLs.
- Deleting objects when a row is deleted.

## Constraints
- Do not add dependencies (use global `fetch`).
- Tests must not hit the network: unit-test `StorageService` with `fetch` mocked (success, non-2xx error, missing credentials).
- Keep the existing multer field names, interceptors and guards untouched.
- Comment language follows each file (Spanish in these files).

## Checklist
- [ ] T1 `StorageService` + module (+ specs: success, error, unconfigured)
- [ ] T2 Wire the 4 image/content controllers (courses, patterns, events, recommendations)
- [ ] T3 Wire lessons, lesson-progress, lesson-comments and the attachments service
- [ ] T4 Verify: backend build + full test suite; manual smoke upload against the dev bucket

## Route
- Delegated direct — ONE bounded writer (10+ files; writer trigger). Parent spot-checks, commits and assesses.

## Acceptance criteria
- No controller writes to `./uploads` anymore; every upload returns an absolute `https://<ref>.supabase.co/storage/v1/object/public/uploads/...` URL.
- A file uploaded through the API is publicly reachable without credentials.
- Legacy `/uploads/...` rows still render.
- Backend suite green (18 suites / 126 tests before this change).

## Verification evidence
(pending)

## Next step
Writer implements T1–T3 and runs T4; parent verifies a real upload, commits and reports. Render needs the PRODUCTION project's `SUPABASE_URL` + service-role key (pending from the user).