# Tasks: Code Quality Refactor — CRITICAL & HIGH Tier

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 2000–3200 |
| 400-line budget risk | High |
| User budget (4000) risk | Medium |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 → 4 |
| Delivery strategy | ask-on-risk |
| Chain strategy | stacked-to-main |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: stacked-to-main
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Focused test command | Runtime harness | Rollback boundary |
|------|------|-----------|----------------------|-----------------|-------------------|
| 1 | Test runner foundation (jest+supertest, vitest) | PR 1 | `npm test` both apps | `npm run build` both apps | Revert package.json + configs + specs |
| 2 | CRITICAL: env secrets, admin via script, aligned migrations | PR 2 | `npm run typecheck`; `migrate reset` on disposable DB | Boot without JWT_SECRET → fail-fast | git revert + restore DB backup |
| 3 | HIGH backend: IDOR + mail loud-fail | PR 3 | `npm test -- e2e` (403/200) | Staging cross-user requests | Revert users/notifications/mail files |
| 4 | HIGH frontend: context split, Profile, favorites/notifications | PR 4 | `npm run test` (vitest) | `npm run dev` staging pass | Revert context/pages; fallback kept |

## Phase 1: Foundation — Test Runner

- [x] 1.1 Add jest, supertest, ts-jest to `backend/package.json` + `test` script
- [x] 1.2 Create `backend/jest.config.js` + `backend/test/smoke.spec.ts`
- [x] 1.3 Add vitest to `costura-app/package.json` + `test` script + `vitest.config.js`
- [x] 1.4 Verify `npm test` green in both apps

## Phase 2: CRITICAL — Secrets, Admin, Migrations

- [x] 2.1 `backend/src/app.module.ts`: fail-fast `JWT_SECRET` validation at boot
- [x] 2.2 `auth.module.ts`, `jwt.strategy.ts`, `auth.service.ts`: inject env secret, drop all fallbacks
- [x] 2.3 `backend/src/main.ts`: remove bootstrap admin creation, stale imports
- [x] 2.4 `prisma/seed.ts` + `scripts/create-admin.js`: require ADMIN_* env, bcrypt-only
- [x] 2.5 `schema.prisma`: reconcile `priceARS`, `priceAUD`, lesson `description`
- [x] 2.6 Create explicit drift migration via `prisma migrate diff`
- [x] 2.7 Remove `db:push` script from `backend/package.json`
- [x] 2.8 Back up + verify restorable DB before migration — DONE 2026-08-21: `pg_dump` backup `backend/costura_app_20260821_160433.backup` verified restorable (63 TOC entries); baseline applied via `prisma migrate resolve --applied` for `add_lesson_comments` + `reconcile_schema_drift`; zero drift confirmed; `migrate status` = up to date

## Phase 3: HIGH — Backend Authorization + Mail

- [x] 3.1 `users.controller.ts`: owner-or-admin in service → 403
- [x] 3.2 `notifications.controller.ts` + `notifications.service.ts`: ownership on read/delete → 403
- [x] 3.3 `backend/package.json`: add `@sendgrid/mail`
- [x] 3.4 `mail.service.ts`: static dep, `MAIL_ENABLED` default-off, log + propagate failures

## Phase 4: HIGH — Frontend Integration

- [x] 4.1 Split `context/CoursesContext.jsx` into 6 domain contexts (catalog, purchases, progress, favorites, notifications, admin)
- [x] 4.2 `costura-app/src/App.jsx`: mount domain providers
- [x] 4.3 `pages/Profile.jsx`: real purchases + empty state
- [x] 4.4 `FavoritesContext.jsx` + `pages/Favorites.jsx` + `components/CourseCard.jsx`: backend read/write, reject unauthenticated toggle
- [x] 4.5 `NotificationsContext.jsx` + `components/Navbar.jsx` + `pages/MyCourses.jsx`: backend fetch/update, surface errors
- [x] 4.6 `data/courses.js`: drop mock-purchase coupling

## Phase 5: Testing — Spec Scenarios

- [x] 5.1 supertest: boot fails fast without `JWT_SECRET`, succeeds with it (auth-admin-security)
- [x] 5.2 supertest: `GET users/:id` → 200 owner, 403 non-owner (access-control-ownership)
- [x] 5.3 supertest: notification read/delete → 403 non-owner (access-control-ownership)
- [x] 5.4 vitest: Profile non-empty + empty purchase states (profile-purchase-history)
- [x] 5.5 vitest: favorite toggle persists; unauthenticated rejected (favorites-notifications-integration)
- [x] 5.6 vitest: one domain update leaves other contexts untouched (favorites-notifications-integration)
- [x] 5.7 `prisma migrate reset` on fresh DB → no drift (data-schema-migrations) — VERIFIED 2026-08-21 on throwaway shadow DB `costura_pr5_shadow` (created + dropped, real DB untouched): `prisma migrate reset --force --skip-seed` applied all 3 migrations cleanly; `migrate status` = "Database schema is up to date!"; `prisma migrate diff --from-url <shadow> --to-schema-datamodel prisma/schema.prisma` = "No difference detected." (transcript in apply-progress)

## Phase 6: Cleanup

- [x] 6.1 Remove sessionStorage fallback after staging validation
- [x] 6.2 Update README/SETUP: `JWT_SECRET`, `ADMIN_*`, `MAIL_ENABLED`, migrations-only
- [x] 6.3 Grep: no plaintext password or fallback secret in source
