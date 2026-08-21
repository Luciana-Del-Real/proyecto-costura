# Design: Code Quality Refactor — Critical and High Tiers

## Technical Approach

Deliver the refactor as two deployable slices: critical configuration/data integrity first, then high-risk authorization and frontend correctness. Preserve NestJS feature modules, Prisma as schema source of truth, React Context API, and `services/api.js`. Add tests alongside each slice, as a soft gate because `strict_tdd` is false.

## Architecture Decisions

| Decision | Choice | Alternatives rejected | Rationale |
|---|---|---|---|
| Runtime secrets | Validate `JWT_SECRET` during configuration, inject it through `JwtModule.registerAsync`, and inject the same value into `JwtStrategy` and reset-token code. | Keep duplicated `process.env` reads; retain fallback. | One fail-fast contract prevents publicly known signing keys and inconsistent secrets. |
| Admin provisioning | Remove bootstrap `seedAdmin`; require `ADMIN_EMAIL`, `ADMIN_PASSWORD`, and `ADMIN_NAME` in the explicit seed/script path, hashing with bcrypt. | Keep automatic bootstrap creation; retain script defaults. | Startup must be safe without admin credentials and no plaintext credential may ship. |
| Authorization | Pass the authenticated principal into user/notification service operations and enforce owner-or-admin centrally in the service boundary. | Trust route IDs; duplicate ad-hoc checks only in controllers. | Every read/write path receives the same IDOR rule and returns 403 before data mutation. |
| Frontend state | Replace the god object with catalog, purchases, progress, favorites, notifications, and admin contexts; expose records and derived IDs separately. | Add fields to `CoursesContext`; keep sessionStorage authoritative. | SRP isolates rerenders and lets Profile consume real records while backend remains authoritative. |
| Email | Use a static `@sendgrid/mail` dependency with an explicit `MAIL_ENABLED` gate; disabled sends are logged as skipped, enabled failures are logged and rethrown. | Dynamic optional require and silent no-op. | Missing dependencies/configuration cannot be hidden, while this change still does not enable production sending. |

## Data Flow

```text
Auth/config → validated JWT providers → guarded Nest controllers
                                      ↓
                              Prisma services → PostgreSQL migrations

React pages → domain contexts → services/api.js → backend endpoints → PostgreSQL
                    ↑                 └─ explicit error state (no silent stale data)
```

## File Changes

| File | Action | Description |
|---|---|---|
| `backend/src/main.ts` | Modify | Remove bootstrap admin creation and obsolete imports; validate configuration before listening. |
| `backend/src/app.module.ts`, `backend/src/auth/auth.module.ts`, `backend/src/auth/strategies/jwt.strategy.ts`, `backend/src/auth/auth.service.ts` | Modify | Centralize required JWT/reset secrets and remove every fallback. |
| `backend/prisma/seed.ts`, `backend/scripts/create-admin.js` | Modify | Require explicit admin environment/arguments; retain hashed provisioning only. |
| `backend/src/users/users.controller.ts`, `backend/src/notifications/{notifications.controller,notifications.service}.ts` | Modify | Enforce owner/admin authorization for profile and notification read/delete operations. |
| `backend/src/mail/mail.service.ts`, `backend/package.json` | Modify | Add SendGrid dependency, env gate, typed message path, explicit logging/propagation; remove `db:push` script. |
| `backend/prisma/schema.prisma`, `backend/prisma/migrations/<explicit-drift-migration>/migration.sql` | Modify/Create | Reconcile `priceARS`, `priceAUD`, and lesson `description` with migration history. |
| `costura-app/src/context/{CoursesContext,CourseCatalogContext,PurchaseContext,ProgressContext,FavoritesContext,NotificationsContext,AdminContext}.jsx`, `src/App.jsx` | Modify/Create | Split providers and consumers; backend-first favorites/notifications with temporary, observable sessionStorage read fallback during rollout. |
| `costura-app/src/pages/Profile.jsx`, `src/pages/Favorites.jsx`, `src/pages/MyCourses.jsx`, `src/components/{CourseCard,Navbar}.jsx` | Modify | Consume domain contexts; render real purchase records and notification state. |
| `backend/test/**/*.spec.ts`, `costura-app/src/**/*.test.{js,jsx}`, both `package.json` files | Create/Modify | Install Jest/Supertest and Vitest scripts and focused security/integration/component tests. |

## Interfaces / Contracts

```ts
type Principal = { id: string; role: 'ADMIN' | 'ALUMNO' };
type PurchaseRecord = { id: string; status: PurchaseStatus; total: number; course: Course; createdAt: string };
// Notification mutations accept (notificationId, principal) and throw 403 for non-owner/non-admin.
```

`PurchaseContext` exposes `purchaseRecords`, `purchases` (approved course IDs), and loading/error state. `FavoritesContext` exposes backend-backed `favorites`, `toggleFavorite`, and `isFavorite`; unauthenticated toggles reject without local mutation. `NotificationsContext` exposes list, unread count, mutations, and fetch errors.

## Testing Strategy

| Layer | What to Test | Approach |
|---|---|---|
| Unit | Env validation, ownership predicates, mail gate, context reducers/helpers | Jest and Vitest isolated tests. |
| Integration | JWT boot contract, users/notifications 403/200 paths, Prisma migration reset, SendGrid propagation | Nest testing module plus Supertest; disposable PostgreSQL for migration checks; mocked SendGrid. |
| E2E/smoke | Login, Profile purchases/empty state, favorites, notifications, all routes after provider split | Vitest/browser-compatible smoke harness and staging manual route pass. |

## Threat Matrix

N/A — no routing, shell, subprocess, VCS/PR automation, executable-file classification, or process-integration boundary.

## Migration / Rollout

Before touching any non-empty DB, take and verify a restorable backup. Use `prisma migrate diff` to document drift, create an explicit reviewed migration, apply it, and verify a fresh `prisma migrate reset`; never use `db:push`. Coordinate `JWT_SECRET` deployment before release because unset configuration must stop boot. Deploy critical slice first, then frontend/high slice to staging. Keep only a time-bounded, read-only sessionStorage compatibility fallback for favorites during backend rollout; remove it after staging validation. Each slice rolls back via `git revert` plus DB restore.

## Open Questions

- [ ] Confirm the staging database backup/restore owner and deployment window.
- [ ] Confirm the exact production flag name/value policy for `MAIL_ENABLED`.
