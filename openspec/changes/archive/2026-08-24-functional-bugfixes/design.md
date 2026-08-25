# Design: Functional Bugfixes

## Technical Approach

Implement the security boundary first, then wire the frontend to the new contracts. Public `CoursesService.findAll/findOne` returns catalog metadata and lesson titles only; authorized admin reads retain management fields, while authenticated learners obtain full content from protected lesson reads. Existing Nest feature modules, Prisma queries, Context API, and `getImageUrl` remain the patterns.

## Architecture Decisions

| Decision | Choice | Alternative rejected / rationale |
|---|---|---|
| Paywall | Predicate `role === ADMIN || approvedPurchase(userId, courseId)`; `deletedAt: null` is required. | Client-only hiding is unsafe; a single reusable service assertion protects every API path. |
| Public/full payloads | `findAll/findOne` select a public shape unless principal is admin; full data only from `GET /courses/:courseId/lessons` (list) and `GET /lessons/:id` (detail). | Returning full courses and relying on React visibility caused the leak. |
| Revocation | Purchase status is the access source of truth; approve accepts `PENDING|REJECTED`, reject accepts `PENDING|APPROVED`. | Deleting progress loses history and makes re-approval brittle. |
| Notifications | Reuse `NotificationsService.createNotification`, with transaction-compatible persistence from the approval transaction. | Email is removed for purchases; in-app unlock is immediate and auditable. |

## Data Flow

`GET /courses` → public projection → `CourseCatalogContext.courses` → catalog/detail titles.

Owned detail: `hasCourse` → `getCourseLessons(course.id)` → protected lesson payload → local learning-course state → `ReactPlayer`, PDFs, attachments.

`PATCH /purchases/:id/approve` → atomic status/progress/notification; `reject` → status REJECTED → predicate fails → content/progress blocked → frontend refreshes `PurchaseContext` on focus.

## File Changes

| Area | Files and change |
|---|---|
| Backend paywall | `courses.service.ts` projection (omit `pdfGuide`, course `attachments`, lesson `videoUrl/pdf/attachments`); `lessons.controller.ts` protected nested list plus flat `GET /lessons/:id`; `lessons.service.ts` full reads; `lesson-comments` access pattern extracted/reused; `purchases.controller.ts/service.ts` owner check, reversible approve/reject, no mail; `lesson-progress.service.ts` approved-purchase assertion; `notifications.service.ts/module.ts` transactional create. |
| Backend profile/auth | `users/dto/update-user.dto.ts` (new), `users.controller.ts/service.ts` owner-or-admin PATCH and Prisma unique error→409; `auth/dto/register.dto.ts` required country; `main.ts` `origin: corsOrigins`; `backend/.eslintrc.cjs` ESLint 8 + typescript-eslint; `mail.service.ts` locale helper; `.env.example` `FRONTEND_URL`, `MAIL_ENABLED`, `SENDGRID_*`. |
| Frontend access/auth | `CourseCatalogContext.jsx` protected lesson loader; `CourseDetail.jsx` fetch/merge full lessons only for approved users; `AuthContext.jsx` async `updateUser`; `Profile.jsx` country form, save/error state; `Auth.jsx` required country; `ResetPassword.jsx` calls `post('/auth/reset-password',{token,password})`; `api.js` deletes dead helpers and request/response logs while retaining error logging. |
| Frontend presentation | `CourseCard.jsx`, `AdminCourses.jsx`, `AdminDashboard.jsx`, `AdminCourseForm.jsx` use `getImageUrl`; `CourseCard.jsx` normalizes uppercase levels; `media.js` one API-origin rule plus fallback; new `public/placeholder-portada.png`, with a small cover fallback rendering the course name. |

## Interfaces / Contracts

```text
GET /api/courses/:courseId/lessons  Authorization: Bearer JWT
GET /api/lessons/:id                Authorization: Bearer JWT
PATCH /api/users/:id {name,email,country}
200: full lesson(s) / updated user {id,email,name,country,role}
401: missing/invalid JWT; 403: predicate or owner failure
409: {statusCode:409,message:"Email already registered"}
```

`public lesson = {id,title,description,duration,order}`. `full lesson` additionally contains `videoUrl`, `pdf`, and `attachments`. `resolveLocale(country)` normalizes code/name, checks an explicit Spanish-country set (Argentina, Bolivia, Chile, Colombia, Costa Rica, Cuba, Dominican Republic, Ecuador, El Salvador, Equatorial Guinea, Guatemala, Honduras, Mexico, Nicaragua, Panama, Paraguay, Peru, Spain, Uruguay, Venezuela) → `es`; otherwise `en`; missing/blank → `es`.

## Testing Strategy

No runner exists. Add planned RED cases for future Jest/Supertest/RTL: anonymous projection, 401/403 lesson/progress/IDOR, approve/reject/re-approve notification, PATCH ownership/409, locale cases, reset mismatch, CORS preflight, badge/image fallback. Verify now with backend `typecheck`, backend/frontend `lint`, both builds, curl with anonymous/approved/foreign-origin requests, and manual browser flows.

## Threat Matrix

Routing boundary is **Applicable**: lesson route split and reset route call; safe behavior is only the documented paths, unknown/unauthenticated paths fail 401/403; RED tests cover both route paths and auth. Documentation-like paths, Git repository selection, commit state, push state, and PR commands are **N/A**: this change does not execute or automate them. No shell, subprocess, executable classification, or process-integration boundary.

## Migration / Rollout

No migration required. Slice 1 security/API (rollback together for projection plus protected lesson fetch); slice 2 profile/auth/mail; slice 3 presentation/hygiene. Each slice is independently revertible except slice 1's coordinated paywall pair. Confirm `CORS_ORIGIN` includes all dev ports before rollout.

## Open Questions

- [ ] None blocking; provider production setup remains documented follow-up.
