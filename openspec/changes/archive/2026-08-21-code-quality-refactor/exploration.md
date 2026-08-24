# Exploration: Code Quality Audit — code-quality-refactor

## Current State

Monorepo with two independent apps (no root package.json): `backend/` (NestJS 10 + Prisma 5 + PostgreSQL, TS strict, 14 feature modules) and `costura-app/` (React 19 + Vite 8 + Tailwind 4, JSX, Context API). No test runner in either app. Last 9 commits added lesson-comments module, certificates (pdfkit), lesson description, backend-driven purchases/progress, and a rebranding pass.

The audit covered all 50 backend TS files, all 32 frontend JSX/JS files, both Prisma migrations, git history (old vs new comments implementations), env files, and cross-app contract usage.

## Affected Areas

- `backend/src/main.ts` — hardcoded admin credentials + duplicated seed logic at bootstrap
- `backend/src/app.module.ts`, `auth.module.ts`, `jwt.strategy.ts`, `auth.service.ts` — duplicated JWT secret fallback
- `backend/src/notifications/*`, `favorites/*` — modules with zero frontend consumers
- `backend/src/users/*`, `purchases/*`, `lessons/*` — authorization/validation placement and error-handling inconsistencies
- `backend/prisma/migrations/*` — schema/migration drift
- `costura-app/src/context/CoursesContext.jsx` — god-object context (SRP violation)
- `costura-app/src/pages/Profile.jsx` + `data/courses.js` — stale mock data vs backend contract (broken purchase history)
- `costura-app/src/pages/Checkout.jsx`, `components/CourseCard.jsx`, `pages/admin/*` — hardcoded URLs/secrets, duplicated logic
- `costura-app/src/services/api.js` — verbose logging, token in sessionStorage

## Findings

### CRITICAL

1. **Hardcoded admin credentials at bootstrap** — `backend/src/main.ts:78-90`. `seedAdmin()` creates a PrismaClient directly in bootstrap and falls back to `ADMIN_PASSWORD || 'Daiana2026!'` (line 79). Also **duplicates** `prisma/seed.ts:10-12` logic (which uses `'Daiana2026'` — inconsistent password between the two paths) and `scripts/create-admin.js` (third path). Three admin-creation code paths with different credentials; one ships a known plaintext password in source.
2. **JWT secret fallback hardcoded** — `backend/src/app.module.ts:27`, `auth.module.ts:16`, `strategies/jwt.strategy.ts:13`, `auth.service.ts:151,196` all fall back to `'fallback-secret-key'`. Any deployment without `JWT_SECRET` uses a publicly-known signing key.
3. **Schema/migration drift** — `backend/prisma/migrations/20260702181820_add_country_to_user/migration.sql` creates `courses.price` (single column) and `lessons` WITHOUT `description`, but `schema.prisma:55-56,78` declares `priceARS`/`priceAUD`/`description`. No migration adds them; the repo relies on `db:push` (`package.json:10`) which mutates the DB without recording history. Migrations cannot reproduce the current schema on a fresh DB.

### HIGH

4. **Notifications IDOR** — `backend/src/notifications/notifications.controller.ts:21-24` (`@Patch(':id/read')`) and `:31-34` (`@Delete(':id')`) operate on any notification id without verifying `req.user.id` ownership. Any authenticated user can mark/delete another user's notifications.
5. **User profile IDOR (info disclosure)** — `backend/src/users/users.controller.ts:11-14` `@Get(':id')` returns any user's id/email/name/role for any authenticated caller.
6. **Email sending is silently dead** — `backend/src/mail/mail.service.ts:4-9` does `require('@sendgrid/mail')`, but `@sendgrid/mail` is NOT in `backend/package.json` (confirmed absent from package-lock). The guarded require always fails; `sendEmail` returns silently (lines 20-24, 31-35). Forgot-password (auth.service.ts:185) and purchase-approval emails (purchases.service.ts:160) never actually send.
7. **Profile purchase history always empty (stale mock data)** — `costura-app/src/pages/Profile.jsx:14` filters `data/courses.js` mock courses (numeric ids 1-6) against backend `purchases` (cuid strings). `courses.js` also uses `price` (line 7) while Profile reads `course.priceARS` (line 117). The filter never matches → empty history; also "Total invertido" (line 122) is always $0.
8. **CoursesContext god-object** — `costura-app/src/context/CoursesContext.jsx` (326 lines) mixes course CRUD, lesson CRUD, purchases, progress, favorites, and user admin ops (deleteUser/toggleUserActive/getAllUsers). SRP violation; every page couples to one giant context. Includes stale comments (lines 9-10, 30-31) admitting favorites are NOT connected to the backend while the backend favorites module exists.

### MEDIUM

9. **Duplicated sequential-completion logic** — `costura-app/src/pages/CourseDetail.jsx:82-85` re-implements the sequential rule the backend enforces (`lesson-progress.service.ts:92-116`). Two sources of truth; drift risk.
10. **Raw `Error` instead of HTTP exceptions** — `lessons.controller.ts:67,93,116` (`'Course ID mismatch'`, `'Lesson does not belong to this course'`), `users.service.ts:45` (`'User not found'`). Inconsistent error contract (500 instead of 400/404).
11. **Validation/authz logic in controllers** — `lessons.controller.ts:66-68,91-94,114-117` (business validation), `purchases.controller.ts:71-77` (ownership check inline instead of a guard).
12. **Hardcoded `http://localhost:3000` in 5 spots** — `CourseCard.jsx:28`, `AdminCourses.jsx:26`, `AdminDashboard.jsx:94`, `AdminCourseForm.jsx:287,349`. Bypasses `utils/media.js getImageUrl` (the existing abstraction).
13. **Debug/verbose logging in production code** — `CourseCard.jsx:20` (`console.log("Datos del usuario:", user)`), `api.js:35,40,48,54` logs full request/response bodies.
14. **`any`-typing defeats strict mode** — `req: any` in every controller; `(p: any)`/`(lesson: any)` in `lesson-progress.service.ts:39,50,51`; `tx: any` in `purchases.service.ts:79`; `(dto as any).pdf` in `lessons.service.ts:35,96` even though `CreateLessonDto.pdf` exists (dead cast).
15. **Unused/misplaced dependencies** — backend: `lucide-react` (React lib in a NestJS app, `package.json:37`), `cors`/`@types/cors` (uses Nest `enableCors`), `@types/express-rate-limit` (v7 ships types); frontend: `axios` (api.js uses fetch), `sharp` (no imports).
16. **Dead backend modules** — `notifications/*` and `favorites/*` have zero frontend consumers (grep confirms). Favorites are stored in sessionStorage instead (`CoursesContext.jsx:93-118`); backend table unused.
17. **CSS architecture debt** — `costura-app/src/index.css` (32 KB) contains dedicated `!important` override sections 5 and 7 ("mapeo de clases hex viejas -> variables (!important)", "FORZADO GLOBAL de color en botones") plus inline `!text-white`/hex classes across JSX. Mix of CSS vars, hex literals, and Tailwind with `!` prefixes.
18. **Giant component** — `costura-app/src/pages/admin/AdminCourseForm.jsx` (476 lines): course form + lesson CRUD + attachments + Q&A reply UI in one component.
19. **Env files committed** — `costura-app/.env`, `.env.production` tracked in git (verified via `git ls-files`). No real secrets today (only `VITE_API_URL`) but the pattern is risky; there is no root `.gitignore`.
20. **Pagination logic duplicated** — `courses.service.ts:42-46` and `purchases.service.ts:233-237` both cap MAX=100 and re-parse; controllers re-parse again (`courses.controller.ts:41-43`, `purchases.controller.ts:33-40`).
21. **Unused DTO / wrapper** — `purchases/dto/approve-purchase.dto.ts` never used (approve takes `@Param`); `lesson-progress.service.ts:142-144` `getCourseProgress` is a no-op wrapper over `getUserCourseProgress`.
22. **Placeholder banking/contact data** — `Checkout.jsx:10-21` `PAYMENT_INFO` placeholders (CVU `0000...`, CBU `00000000`) with TODO, and a hardcoded WhatsApp number `5493447404952` (line 50).
23. **Three admin-seed paths with divergent data** — `main.ts seedAdmin` (bcrypt 10, `Daiana2026!`), `prisma/seed.ts` (bcrypt 12, `Daiana2026`), `scripts/create-admin.js` (third copy). Also `scripts/reset-all-except-admin.js` / `e2e-reset-flow.js` are destructive ad-hoc scripts tracked in the repo.
24. **Orphan root artifacts** — root `package-lock.json` with no root `package.json`; `costura-app/build-check.log` committed-ish leftover; `backend/prisma/seed.js` + `seed.d.ts` compiled artifacts on disk.

### LOW

25. **Encoding corruption (mojibake) in user-facing strings** — backend DTOs (`register.dto.ts:11,14,17`, `login.dto.ts:4,8`, `reset-password.dto.ts:8`, `create-course.dto.ts:4,6,11,13,16` — `vǭlido`, `Contrase��a`, `Pa��s`, `T��tulo`, `nǧmero`); frontend `AdminNavbar.jsx:4-8` (corrupted icons `'�Y"S'` etc.), `Footer.jsx` (`dise��o`, `Navegaci��n`, `�Y"? Redfern`), `ProtectedRoute.jsx:4`/`AdminRoute.jsx:4` (`�Y��` spinner). Files were saved/read with mismatched encodings.
26. **`Auth.jsx:14` logs out on mount** — visiting `/login` always destroys the session, even if the user navigates there while logged in.
27. **Inconsistent confirmation/error UX** — `alert()` in `CourseDetail.jsx:130,141,151`, `AdminCourseForm.jsx` (many); `window.confirm` in `AdminCourses.jsx:49` vs bare `confirm` elsewhere; no shared feedback component.
28. **`key={i}` index keys** — `AdminSales.jsx:123`.
29. **Static mock data with rickroll videos** — `data/courses.js:13-18,35-41,...` all lessons point to `dQw4w9WgXcQ`; array used only by Profile (broken, see #7) and `testimonials` (Home).
30. **Unused/unpopulated model fields** — `Course.students` never written (CourseDetail.jsx:57 always renders 0); `Course.featured` unused by frontend (Home.jsx:27 uses `slice(0,3)`); `priceAUD`/`priceARS` fallback logic in `CourseCard.jsx:72-75` shows AUD when `country` is undefined.
31. **`@Res()` in certificates controller** — `certificates.controller.ts:15-35` bypasses Nest exception pipeline; if `res.headersSent` is true the handler returns `undefined` (hung request).
32. **Route-prefix coupling** — `api.js:1` falls back to `http://localhost:3000` (no `/api`), while all env files set `VITE_API_URL=.../api`. Missing env → 404s on every call.
33. **`lesson-comments` access check skips `deletedAt`** — `lesson-comments.service.ts:20` checks `status: 'APPROVED'` but not `deletedAt: null`, unlike `purchases.service.ts:83` — inconsistent soft-delete handling.

### VERIFIED CLEAN (no residue)

- Old SQL-crude comments implementation: **no residue**. `git log -S` shows comments only in `bed2ec1` (new module), `22c8fdb` (frontend), and `b8a2229` (base). Current `backend/src` has zero `queryRaw`/`executeRaw`; `lesson-progress/*` contains no comment code; the migration `20260801000000_add_lesson_comments` creates the table fresh (no orphan table from the old implementation).
- No `.bak`/`.old`/`.orig`/`.tmp` files anywhere.
- Cross-endpoint contract: all frontend calls (`/courses`, `/courses/:id/lessons*`, `/lessons/:id/comments`, `/progress/courses/:id`, `/progress/lessons/:id`, `/purchases*`, `/users*`, `/courses/:id/certificate`, `/attachments/:id`, `/auth/*`) resolve to existing backend routes with matching field shapes, EXCEPT the Profile mock-data bug (#7) and the unused notifications/favorites modules (#16).

## Approaches

1. **Sweep refactor (fix-everything-in-one-change)** — address all findings in a single `code-quality-refactor` change.
   - Pros: one proposal/spec/design/tasks cycle; holistic.
   - Cons: very large diff (well over the 400-line review budget — must chain PRs); high regression risk without tests; mixes security fixes with cosmetic changes.
   - Effort: High

2. **Tiered refactor (security/data-integrity first, then architecture)** — Change 1: CRITICAL+HIGH (secrets, migration alignment, IDOR fixes, dead mail, Profile bug). Change 2: MEDIUM (context split, hardcoded URLs, error handling). Change 3: LOW (encoding, cleanup).
   - Pros: each change reviewable; security issues land first; aligns with 400-line PR budget via chained PRs.
   - Cons: more orchestration cycles; some fixes (e.g. schema migration) need a DB plan/rollback.
   - Effort: Medium (per change)

3. **Minimal hotfix + separate backlog** — fix only CRITICAL (secrets, migration drift) now; log the rest as issues.
   - Pros: smallest risk; fastest.
   - Cons: leaves known broken features (Profile history, dead emails, IDOR) live; debt compounds.
   - Effort: Low

## Recommendation

Approach 2 (tiered). Order the work: (a) CRITICAL security + schema/migration alignment with a rollback plan (restore dump before `migrate dev`); (b) HIGH correctness fixes (IDOR, mail deps, Profile mock-data, context split); (c) MEDIUM/LOW hygiene (encoding, logging, unused deps, dead code). Deliver as chained PRs to respect the 400-line review budget. Note `strict_tdd: false` — no tests exist; adding a minimal test harness (e.g. vitest for frontend utils, jest+supertest for backend guards/services) should be part of the change scope where practical, but not a hard gate.

## Risks

- Schema/migration alignment: `prisma migrate dev` on the existing DB may require resolving drift first (use `migrate diff` + explicit migration, never `db push` again); production DB backup required.
- Removing `fallback-secret-key` must be paired with ensuring `.env` sets `JWT_SECRET`, or the app will fail to start after the fix — coordinate with deploy.
- Splitting CoursesContext touches every page; needs a smoke pass of all routes (no test runner to catch regressions).
- Encoding fixes touch many files → large diff; keep them in the LOW tier to isolate churn.
- Silent email dead-path means users never received reset/approval emails; enabling real email (adding `@sendgrid/mail`) changes behavior users may not expect — surface this in the proposal.

## Ready for Proposal

Yes. The orchestrator should tell the user: audit complete with 3 CRITICAL / 5 HIGH / 16 MEDIUM / 9 LOW findings and a verified-clean residue check. Recommended change name `code-quality-refactor`, tiered delivery (security → correctness → hygiene), chained PRs.