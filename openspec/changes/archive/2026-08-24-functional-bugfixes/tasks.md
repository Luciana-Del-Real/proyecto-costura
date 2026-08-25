# Tasks: Functional Bugfixes Bundle (bugs 1–9 + E1–E4)

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~550–700 total (A ~250, B ~170, C ~120, D ~80) |
| 400-line budget risk | High |
| Session review budget (4000) risk | Low |
| Chained PRs recommended | Yes |
| Suggested split | PR1 Slice A → PR2 Slice B → PR3 Slice C → PR4 Slice D |
| Delivery strategy | ask-on-risk |
| Chain strategy | stacked-to-main |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: stacked-to-main
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Focused test command | Runtime harness | Rollback boundary |
|------|------|-----------|----------------------|-----------------|-------------------|
| A | Paywall projection + lesson/purchase/progress guards + approve/deny + unlock notification + coordinated frontend flow | PR 1 | backend `npm run typecheck`; curl anon `GET /api/courses` shows no videoUrl/pdf | curl anon/approved/foreign-origin; manual owned-learning pass | Revert courses/lessons/purchases/progress/notifications + CourseCatalogContext/CourseDetail together |
| B | CORS, backend lint, log cleanup, dead helpers, reset wiring, mail locale, country required | PR 2 | backend `npm run lint` + typecheck; frontend `npm run lint` | curl OPTIONS foreign origin; manual reset (email E2E N/A: MAIL_ENABLED off in dev) | Revert main.ts/.eslintrc.cjs/api.js/ResetPassword.jsx/mail.service.ts/auth.service.ts/register.dto.ts/Auth.jsx independently |
| C | PATCH /users/:id + DTO + AuthContext/Profile wiring + 409 | PR 3 | backend typecheck; frontend lint + build | Manual profile edit + reload; duplicate email → 409 | Revert users module + AuthContext/Profile together |
| D | Badge map, placeholder covers, localhost cleanup, remove purchase email | PR 4 | frontend lint + build; grep localhost = 0; grep purchase email = 0 | Manual badge colors + covers (email N/A: dev has no MAIL_ENABLED) | Revert CourseCard/media.js/placeholder asset/purchases deletion independently |

## Slice A (PR 1): Security & Ownership — backend + coordinated frontend

- [x] 1.1 RED: `curl -s localhost:3000/api/courses` returns videoUrl/pdf (leak reproduced); backend typecheck baseline
- [x] 1.2 `courses.service.ts`: public projection omits lesson videoUrl/pdf/attachments + course attachments/pdfGuide; admin keeps full shape
- [x] 1.3 `lessons.controller.ts`: guard `GET /courses/:courseId/lessons` + flat `GET /lessons/:id` with JwtAuthGuard + approved-purchase-or-admin (reuse `assertAccess`); GREEN: anon 401, non-approved 403
- [x] 1.4 `lessons.service.ts`: full lesson reads (videoUrl/pdf/attachments) for guarded routes
- [x] 1.5 `purchases.controller/service.ts`: owner-or-admin on `GET /purchases/:id` (IDOR 403); approve accepts PENDING|REJECTED, reject PENDING|APPROVED (reversible)
- [x] 1.6 `lesson-progress.service.ts`: approved-purchase check on `GET /progress/courses/:courseId` → 403 without
- [x] 1.7 `notifications.service/module.ts`: transaction-compatible createNotification; approve → unlock notification, deny → none
- [x] 1.8 `CourseCatalogContext.jsx` + `CourseDetail.jsx`: owned learners fetch full lessons from protected endpoint; others titles only
- [x] 1.9 GREEN curl suite: anon catalog no videoUrl; anon lesson 401; approved 200; foreign purchase 403; deny 403; re-approve 200; notification row on approve

## Slice B (PR 2): Auth, Admin & Security

- [x] 2.1 `main.ts`: `enableCors({ origin: corsOrigins })`, drop `origin: true` + console.log; RED foreign preflight accepted → GREEN rejected
- [x] 2.2 New `backend/.eslintrc.cjs`: typescript-eslint recommended; `npm run lint` passes (no "couldn't find config")
- [x] 2.3 `api.js`: delete dead forgotPassword/resetPassword helpers (double `/api` prefix) + request/response logs; keep error logging
- [x] 2.4 `ResetPassword.jsx`: `handleSubmit` → `post('/auth/reset-password', {token, password})`; password===confirm, mismatch → client error, no request
- [x] 2.5 `mail.service.ts` + `auth.service.ts`: `resolveLocale(country)` (Spanish set → es, else en, blank → es) wired into reset email
- [x] 2.6 `register.dto.ts` + `Auth.jsx`: country required; register without country → validation error
- [x] 2.7 `.env.example`: document `FRONTEND_URL`, `MAIL_ENABLED`, `SENDGRID_*`

## Slice C (PR 3): Profile Self-Edit

- [x] 3.1 New `users/dto/update-user.dto.ts`: optional validated name/email/country
- [x] 3.2 `users.service.ts` + `users.controller.ts`: `PATCH /users/:id` via `isOwnerOrAdmin`; Prisma P2002 → 409 `{message:"Email already registered"}`; RED: other-user PATCH → 403
- [x] 3.3 `AuthContext.jsx`: async `updateUser` → `PATCH /users/:id`, merge server response
- [x] 3.4 `Profile.jsx`: name/email/country form, save/error state, 409 message shown
- [x] 3.5 GREEN: owner PATCH 200 + persists reload; duplicate email → 409, no data leak

## Slice D (PR 4): Presentation & Hygiene

- [x] 4.1 `CourseCard.jsx`: badge map lowercase-normalized (`level?.toLowerCase()`); uppercase enums never gray
- [x] 4.2 `media.js`: single API-origin rule + fallback; CourseCard/AdminCourses/AdminDashboard/AdminCourseForm srcs via `getImageUrl`
- [x] 4.3 New `public/placeholder-portada.png` + cover fallback showing course name (no broken image)
- [x] 4.4 `purchases.service.ts`: remove purchase-email send (dead `/courses/:id` link); reset email kept
- [x] 4.5 GREEN: `grep http://localhost:3000 src/` = 0; frontend lint/build clean (no new problems vs 22 baseline)

## Slice E (PR 6): Admin sales status list fix

Bug found in PR5: `getAllPurchases` filters `status: APPROVED`, so REJECTED purchases disappear from the sales table and the "Reaprobar" button never renders (UI handles REJECTED but backend never sends it).

- [x] 6.1 `purchases.service.ts`: `getAllPurchases` returns all non-deleted purchases (drop status filter, keep `deletedAt: null`)
- [x] 6.2 `AdminSales.jsx`: revenue cards, total-sales count and per-course chart count only `APPROVED`; the detail table shows every status with badge + Denegar/Reaprobar actions
- [x] 6.3 GREEN: deny a purchase in `/admin/ventas` → badge "Denegada" appears, "Reaprobar" button shows, re-approve restores "Aprobada" and revenue/totals update correctly