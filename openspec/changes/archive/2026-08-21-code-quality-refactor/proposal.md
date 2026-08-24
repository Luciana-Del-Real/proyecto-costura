# Proposal: Code Quality Refactor — CRITICAL & HIGH Tier

## Intent

The app ships known security holes and broken features: hardcoded admin password and JWT fallback in source, IDOR on profile and notifications, schema↔migration drift (DB non-reproducible), silently-dead email, and a Profile whose purchase history is always empty. This change fixes the CRITICAL + HIGH tiers; MEDIUM/LOW hygiene is deferred to a later change.

## Scope

### In Scope
- CRITICAL security: remove hardcoded admin password + JWT fallback; admin via env/script only; `JWT_SECRET` from env
- CRITICAL data: align Prisma schema with migrations; DB reproducible; remove `db:push`
- HIGH IDOR: `users/:id` → self/admin only; notifications ownership checks
- HIGH mail: add `@sendgrid/mail`, fix dead path; do NOT enable real sending (env-gated)
- HIGH Profile: read real backend purchases; drop mock-data coupling
- HIGH context: split `CoursesContext`; wire favorites + notifications to backend (replace sessionStorage)
- Install a test runner (jest+supertest backend, vitest frontend); staging validates

### Out of Scope
- MEDIUM/LOW tier (encoding/mojibake, hardcoded URLs, logging, unused deps, CSS debt, giant components)
- Enabling real email sending

## Capabilities

> Researched `openspec/specs/` — no specs exist yet; all are new.

### New Capabilities
- `auth-admin-security`: JWT secret sourced from env (no hardcoded fallback); admin created only via env/script, never at bootstrap with a plaintext password
- `access-control-ownership`: `users/:id` restricted to self/admin; notification read/delete require ownership
- `data-schema-migrations`: schema↔migrations aligned; fresh DB reproducible from `migrate`; `db:push` removed
- `favorites-notifications-integration`: favorites + notifications backend-backed (replace sessionStorage); `CoursesContext` split per SRP
- `profile-purchase-history`: Profile renders real backend purchases; mock-data coupling removed
- `mail-service`: depends on `@sendgrid/mail` and fails loudly; sending NOT enabled in this change

### Modified Capabilities
- None (no existing specs in `openspec/specs/`)

## Approach

Tiered chained PRs by severity, within the 400-line review budget (delivery_strategy: ask-on-risk; budget 4000 lines). Slice 1 = CRITICAL (security + schema/migration with DB backup/rollback). Slice 2 = HIGH (IDOR, mail dep, Profile, context split). Tests added per slice where practical (strict_tdd: false — not a hard gate). Staging validates each slice; chained PRs keep diffs reviewable.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `backend/src/main.ts`, `app.module.ts`, `auth.module.ts`, `strategies/jwt.strategy.ts`, `auth.service.ts` | Modified | Remove hardcoded admin + JWT fallback secret |
| `backend/prisma/schema.prisma`, `prisma/migrations/` | Modified | Align schema↔migrations; add missing migration |
| `backend/src/notifications/notifications.controller.ts`, `users/users.controller.ts` | Modified | Ownership / self-admin guards (IDOR) |
| `backend/src/mail/mail.service.ts`, `backend/package.json` | Modified | Add @sendgrid/mail; fix silent dead path |
| `costura-app/src/pages/Profile.jsx`, `data/courses.js`, `context/CoursesContext.jsx` | Modified | Real backend purchases; context split; wire favorites/notifications |
| `backend/`, `costura-app/package.json` | New | Test runner deps + scripts |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| `migrate dev` on live DB needs drift resolution | High | `migrate diff` + explicit migration; DB backup before; never `db:push` again |
| Removing JWT fallback breaks boot if `JWT_SECRET` unset | Med | Coordinate deploy; fail-fast with clear error |
| CoursesContext split touches every page | Med | Smoke-test all routes on staging (no test runner today) |
| Wiring favorites/notifications changes persisted data | Med | Staging first; keep sessionStorage fallback during migration |

## Rollback Plan

Revert each PR slice via `git revert`; restore the DB dump taken before the schema migration; re-add `JWT_SECRET` as a temporary hotpatch only if boot fails. Each slice is independently revertible.

## Dependencies

- `@sendgrid/mail` (added to backend deps, not called in prod this change)
- jest + supertest (backend), vitest (frontend)
- Staging DB backup tooling

## Success Criteria

- [ ] No hardcoded admin password or JWT fallback in source (grep clean)
- [ ] `prisma migrate reset` reproduces schema; `db:push` script removed
- [ ] `users/:id` + notifications IDOR return 403 for unauthorized callers
- [ ] Profile shows real purchase history (non-empty for users with purchases)
- [ ] Mail service no longer fails silently; sending stays disabled
- [ ] Favorites/notifications read/write hit backend, not sessionStorage
- [ ] Test runner installed and runs (smoke green on staging)
