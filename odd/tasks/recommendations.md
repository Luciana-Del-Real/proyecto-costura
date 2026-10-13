# Feature: Recommendations (pattern-style cards + admin form)

## Objective
Turn the empty "Recomendaciones" section into a real feature: public cards that look exactly like the pattern cards, backed by a new DB entity, with an admin form that contains **Imagen, Título, Descripción y Link**.

## Problem
The pages exist but are blank ("Muy pronto") and there is no backend model, no admin CRUD and no public listing.

## Why
Product request: recommendations with image + title + description + link, presented like the pattern cards.

## Scope
- `backend/prisma/schema.prisma` — new `Recommendation` model (title required; description/image/link optional; `active` default true; timestamps; `@@map("recommendations")`).
- New migration `add_recommendation` via `prisma migrate dev` (backend dev is STOPPED, so no Windows query_engine EPERM).
- New module `backend/src/recommendations/` mirroring the events module exactly:
  - `recommendations.service.ts` (findAllPublic active-only, admin CRUD)
  - `recommendations.controller.ts` (public `GET /recommendations`)
  - `admin-recommendations.controller.ts` (`@Controller('admin/recommendations')`, JwtAuth+Admin guards, GET list/:id, POST, PUT, DELETE; POST/PUT with FileFieldsInterceptor for field `image` -> `./uploads/recommendations`, same diskStorage pattern as admin-events)
  - `dto/create-recommendation.dto.ts` + `dto/update-recommendation.dto.ts` (title required on create; strings lenient, no IsUrl on link)
  - `recommendations.module.ts`
- `backend/src/app.module.ts` — register RecommendationsModule.
- `costura-app/src/services/api.js` — `listPublicRecommendations`, `listAdminRecommendations`, `getRecommendation`, `createRecommendation`/`updateRecommendation` (FormData-aware, like events), `deleteRecommendation`.
- `costura-app/src/pages/Recommendations.jsx` (NEW, replaces Productos.jsx which is DELETED) — PageHeader + loading/empty/error + grid `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8` of pattern-style cards.
- `costura-app/src/pages/admin/AdminRecommendations.jsx` (NEW, replaces AdminProductos.jsx DELETED) — PageHeader + SearchInput + rows (thumb, title, link, Editar/Eliminar with confirm dialog) + "＋ Nueva recomendación" button.
- `costura-app/src/pages/admin/AdminRecommendationForm.jsx` (NEW) — fields: **Imagen** (FilePicker + preview, optional), **Título** (required), **Descripción**, **Link**; FormData submit when a file is chosen; routes `/admin/recomendaciones/nuevo` and `/admin/recomendaciones/editar/:id`.
- `costura-app/src/App.jsx` — new routes + imports; keep the `/productos` and `/admin/productos` redirects.

## Card spec (estéticamente = patrón)
Copy the PatronesGratis card markup exactly (same classes): root `card-glow rounded-2xl p-6 h-full flex flex-col`; preview `rounded-xl h-36 overflow-hidden mb-4` (image `w-full h-full object-cover rounded-xl`, or placeholder block alternating `bg-primary-soft`/`bg-accent-soft` with a `Sparkles` icon `w-12 h-12 text-primary` when no image); title `font-body text-text-ink text-lg font-bold mb-2 leading-tight`; description `text-text-ink text-sm leading-relaxed mb-4 flex-1` (render only when present); CTA at the bottom: when `link` present an `<a href={normalized} target="_blank" rel="noreferrer" className="btn btn-primary w-full text-sm">Ver más</a>` where `normalized` prepends `https://` when the link lacks a scheme; otherwise a disabled span `btn w-full text-sm bg-stone-200 text-stone-500 cursor-not-allowed` with "Sin enlace".

## Admin form layout convention
Same as AdminEventForm: PageHeader + BackLink + `card-flat rounded-2xl p-8` form, `space-y-6`, every field with the standard label (`block text-sm font-medium text-text-ink mb-1.5`) + input (`w-full border-2 border-border rounded-xl px-4 py-3`), submit `btn btn-primary w-full`. Labels: "Imagen (opcional)", "Título", "Descripción", "Link". UI copy in Spanish.

## Out of scope
- No search/filter on the public page (only the grid).
- No soft-hide UI in admin (delete is hard, like events).
- No notifications tied to recommendations.

## Constraints
- Keep the `active` soft-hide convention: public lists only `active = true`; admin list shows everything.
- Comment language follows each file's existing language (Spanish in these files).
- Do not touch other files; the migration is created by `prisma migrate dev --name add_recommendation` run from `backend/`.
- Frontend verification must keep 171 tests green; backend 113 tests green.

## Checklist
- [ ] T1 Model + migration `add_recommendation` + client regenerate
- [ ] T2 Backend module `recommendations` (service, public + admin controllers with multer `image`, dtos, module, app.module registration)
- [ ] T3 Frontend api functions
- [ ] T4 Public page + pattern-style cards (Recommendations.jsx)
- [ ] T5 Admin list page (AdminRecommendations.jsx)
- [ ] T6 Admin form (AdminRecommendationForm.jsx) with Imagen/Título/Descripción/Link
- [ ] T7 App.jsx routes + imports (old blank pages deleted, redirects kept)
- [ ] T8 Verify: backend build + 113 tests + migrate status; frontend 171 tests + lint + build

## Route
- T1–T8: delegated direct — ONE bounded writer (13+ files across backend + frontend; writer trigger). Parent does the spot check, work-unit commit and the post-commit review assessment.

## Acceptance criteria
- `GET /recommendations` returns only active items with image/title/description/link.
- Admin can create/edit/delete recommendations; image upload works (multipart `image`, stored under `./uploads/recommendations`).
- Public cards look and behave like pattern cards (image placeholder, title, description, "Ver más" external button).
- Migrations applied and Prisma client regenerated; both test suites green.

## Verification evidence
- Writer (one bounded general agent) implemented T1–T8. During migration it hit a NON-interactive-shell limitation (`prisma migrate dev` refuses) and improvised `migrate diff --shadow-database-url` pointing at the REAL Supabase DB — Prisma treated it as disposable: reset the schema, deleted `_prisma_migrations`, dropped the legacy drift columns on `notifications`. Writer recovered via `migrate resolve --applied` baseline + `migrate deploy` + `prisma generate`.
- **PARENT re-verification (direct, against the real DB)**: `_prisma_migrations` restored (17/17, `migrate status` up to date), 17 app tables exist, `recommendations` has the 8 expected columns, all tables EMPTY (0 rows); the user confirmed the DB was ALREADY empty before the incident → no data loss. The dropped `notifications` template-key columns are not in the schema nor used by the runtime (grep), matching the repo history → harmless cleanup of the old asymmetry backlog.
- Writer-reported checks (re-run by parent below): backend build + 17 suites/113 tests; frontend 30 files/171 tests, lint, build.

## Incident record (testigos)
- 2026-10-13: writer misused `--shadow-database-url` on the real DB (migrate dev is non-interactive in this shell). Recovery verified by parent. No data loss (DB was empty). Lesson: NEVER pass a real DB as shadow; for non-interactive shells use `migrate diff --from-migrations` pointing the shadow at a THROWAWAY local DB, or `migrate deploy` after authoring the migration SQL manually.

## Review assessment
- Native review started (`lineage review-c774a2f3323e66e5`, tier **high**, 4 lenses, correction budget 200, base `fd0e744e…`).
- Reviewer lentes: resilience, risk and readability were admitted; **reliability** was refused twice by the transport (`opencode_review_transport_relay_refused: output_refused`). Native recovery (`capture-unachievable` declare + `--withdraw`) re-offered the slot and the retry was admitted.
- **Finding R3-001** (reliability, CRITICAL, deterministic, introduced): the feature shipped its whole external contract with zero automated tests. **Bounded correction applied**: `backend/test/recommendations.spec.ts` (public list active-only, admin list, 404 unknown id, null optional fields, update-then-404, delete count 0 / success, controller delegation, `/uploads/recommendations/…` mapping) and `costura-app/src/pages/Recommendations.test.jsx` (title/description render, link normalized to https:// + `target=_blank`/`rel=noreferrer`, disabled `Sin enlace` state, empty state).
- Post-correction verification: backend **18 suites / 124 tests**, frontend **31 files / 175 tests**, lint and build green.
- Closure note: the native lifecycle then required an `intended-untracked-selection` document whose exact JSON shape is not documented (`review schema` does not cover it; probes were `not_started` and `retry_safe`). User decision: commit the correction and retry closure.

## Next step
Commit the correction, retry the native closure against the corrected committed candidate, then report and let the user decide push/PR.