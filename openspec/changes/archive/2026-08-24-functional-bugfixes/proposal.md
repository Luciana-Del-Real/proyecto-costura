# Proposal: Functional Bugfixes Bundle

## Intent

Grow Creative Education Studio ships with 9 verified functional bugs plus 4 extra defects that undermine a paying product. The most severe — public lessons leaking paid video/PDF/attachments behind the paywall (bug 7) — lets any anonymous visitor bypass purchase and consume course content for free. Alongside it: profile edits never persist, reset-password is a dead stub, purchase emails link to non-existent routes, level badges render gray, course covers 404, CORS is wide open, and backend lint has no config. This change fixes all 13 items in one security-first bundle so the studio can sell courses safely.

## Scope

Ordered by priority (security first):

### In Scope

| # | Item | Severity |
|---|------|----------|
| 7 | Paywall leak: strip lesson content from public catalog + guard lesson GETs | Critical |
| E2 | `GET /purchases/:id` ownership check (IDOR) | High |
| E3 | `GET /progress/courses/:courseId` purchase check | High |
| 9 | CORS harden (`origin: corsOrigins`, drop dead `origin:true`) | High |
| 3 | Reset-password flow: implement submit + delete dead `api.js` helpers (E1) | Med |
| 4 | Profile self-edit (name/email/country) — new `PATCH /users/:id` | Med |
| 5 | Remove purchase-email send (dead `/courses/:id` link) | Med |
| 8 | Backend eslint config | Low |
| 2 | Remove localhost hardcodes → `getImageUrl` | Low |
| 6 | Placeholder cover asset (course name) | Low |
| 1 | Level badge mapping (enum case) | Low |
| E4 | Remove noisy request/response console logs | Low |

### Out of Scope

- Certificates module (untouched — owner confirmed complete)
- Email provider/SendGrid production setup; `MAIL_ENABLED`/`FRONTEND_URL`/SendGrid env documented as follow-up only (do not pretend it works in dev)
- Design/styling beyond badge-color and placeholder fixes (owned by `design-system` change)
- DB migrations (no schema change required; `country` already on `User`)
- E5 plaintext admin password (dev-only, gitignored)

## Business Rules

- **Access model**: student REQUESTs a course → admin APPROVES → access unlocks (video/PDF/attachments). No online payment. Admin DENIES → access REVOKED; denial is REVERSIBLE (can re-approve).
- **Paywall**: non-purchasing visitor sees lesson TITLES only (catalog/detail); never video, PDFs, or attachments. No free sample lesson — everything behind purchase.
- **Access unlock notification**: student gets an in-app NOTIFICATION on unlock. NO purchase email is sent (bug 5 resolved by removal).
- **Reset-password email**: kept; language by student country — Spanish-speaking countries → Spanish, others → English, no country → Spanish.
- **Country required** at registration (email language always resolves).
- **Profile edit**: name, email, country editable from Profile; email uniqueness conflict → clear error message (409).
- **Course levels**: backend enum `PRINCIPIANTE|INTERMEDIO|AVANZADO` (uppercase); frontend badge map fixed to match (never gray).
- **Course covers**: no image → brand-consistent placeholder showing the course name.

## Capabilities

> Contract for sdd-spec. Existing spec names verified against `openspec/specs/`.

### New Capabilities
- `course-catalog-presentation`: frontend catalog rendering — level badge mapping (1), image URL abstraction / no-localhost (2), placeholder covers (6).
- `code-quality-hygiene`: backend eslint config (8) + frontend console-log noise removal (E4).

### Modified Capabilities
- `access-control-ownership`: paywall content projection + lesson GET guards (7), purchase ownership (E2), progress purchase check (E3); adds request→approve→revoke model + in-app unlock notification.
- `auth-admin-security`: reset-password flow completion (3, E1) + CORS hardening (9).
- `profile-purchase-history`: profile self-edit persistence (4), country required at registration, email-uniqueness error contract.
- `mail-service`: remove purchase-email send (5), reset-password email language by country.

## Approach

- **Paywall (7)**: project public course payload to exclude `videoUrl`/`pdf`/`attachments` (titles only); guard `GET /courses/:courseId/lessons` + `GET /lessons/:id` with `JwtAuthGuard` + approved-purchase-or-admin (reuse `assertAccess`). Owned learners fetch full content from the protected endpoint; adjust `CourseDetail.jsx` data flow so owned users don't rely on the public payload.
- **Ownership (E2/E3)**: add owner-or-admin check to `GET /purchases/:id`; add approved-purchase check to `GET /progress/courses/:courseId`.
- **Profile edit (4)**: new `PATCH /users/:id` via `isOwnerOrAdmin`; fields name/email/country; 409 on email conflict. Wire `AuthContext.updateUser` to call it and merge server response.
- **Reset password (3/E1)**: implement `ResetPassword.handleSubmit` → `post('/auth/reset-password', {token, password})`; validate password===confirm; delete dead `api.js` helpers.
- **CORS (9)**: pass `origin: corsOrigins` into `enableCors`; remove `console.log`.
- **Email (5)**: remove purchase-email send from `purchases.service`; keep reset-password email with country-based language.
- **Frontend (1/2/6/E4)**: fix badge map keys (lowercase normalize), route all images through `getImageUrl`, add placeholder asset, remove `api.js` console logs.
- **Lint (8)**: add backend `.eslintrc.cjs` (typescript-eslint recommended).

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `backend/src/courses/` | Modified | Public payload projection, owned-content path |
| `backend/src/lessons/` | Modified | GET guards |
| `backend/src/purchases/` | Modified | Ownership check, remove email send |
| `backend/src/lesson-progress/` | Modified | Purchase check on GET |
| `backend/src/users/` | Modified | New PATCH endpoint |
| `backend/src/main.ts` | Modified | CORS origin |
| `backend/.eslintrc.cjs` | New | Lint config |
| `costura-app/src/pages/ResetPassword.jsx` | Modified | Implement submit |
| `costura-app/src/context/AuthContext.jsx` | Modified | updateUser → API |
| `costura-app/src/components/CourseCard.jsx` | Modified | Badge map, image URL |
| `costura-app/src/services/api.js` | Modified | Delete dead helpers, remove logs |
| `costura-app/src/utils/media.js` | Modified | Image abstraction |
| `costura-app/public/placeholder-portada.png` | New | Placeholder asset |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Paywall fix breaks owned learning view | Med | Coordinate payload projection + frontend data flow; owned users fetch from protected endpoint |
| Email-uniqueness error contract unclear | Low | Return 409 with clear message; assert in spec |
| Reset flow untestable in dev (mail disabled) | Med | Document SendGrid env follow-up; never reintroduce console token leak |
| CORS tightening breaks dev ports | Low | Verify `CORS_ORIGIN` env includes dev origins |

## Rollback Plan

Revert the change commit. Each bug is independent; partial revert of any subset is safe EXCEPT bug 7, whose payload projection and frontend data-flow change MUST revert together. No DB migration → no data rollback needed.

## Dependencies

- None new. SendGrid/`MAIL_ENABLED` production setup is a documented follow-up, not a blocking dependency.

## Success Criteria

- [ ] Anonymous `GET /api/courses` returns no `videoUrl`/`pdf`/`attachments`.
- [ ] Owned learner sees full lesson content; non-owner sees titles only.
- [ ] Profile edits persist across reload; duplicate email → clear 409 error.
- [ ] Reset-password flow completes (with mail configured).
- [ ] Level badges show correct colors; covers show placeholder when no image.
- [ ] No `localhost` hardcodes; no noisy console logs; backend `npm run lint` passes.

## Proposal question round

No open questions. All business rules above are owner-approved and final (access model, paywall, notification, email language, country required, profile fields, level casing, placeholder covers, certificates out of scope, email infra as follow-up).
