# Proposal: Web Push Device Notifications

## Intent

Notifications today surface only inside the in-app bell (campanita) via 30s polling — users must be browsing to see them. Time-sensitive events (admin replies, purchase approvals, student questions) go unnoticed. This change delivers every bell notification to the user's devices via standard Web Push (`web-push` + VAPID), dispatched from the two existing chokepoint creation methods in `NotificationsService`, with minimal PWA support so iOS Safari 16.4+ (installed to home screen) is covered. **User-approved scope decision: PWA + iOS included.**

## Scope

### In Scope
- **Backend push**: Prisma `PushSubscription` model + migration; new `push-notifications` module (web-push, VAPID, JWT-guarded subscribe/unsubscribe endpoints); dispatch from `createNotification` / `createNotificationsForAdmins` — fire-and-forget after commit; prune subscriptions on HTTP 404/410.
- **PWA + SW**: `manifest.json` + icons, service worker (`push` + `notificationclick` → open `data.url`), registration on boot, iOS installability.
- **Subscription lifecycle**: new `PushProvider` under `AuthProvider`, keyed on auth user; post-login consent banner; endpoint upsert on login.
- **Env/deploy**: `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` / `VAPID_SUBJECT` (backend `.env.example`, `render.yaml` `sync: false`); `VITE_VAPID_PUBLIC_KEY` in frontend env files.

### Out of Scope
- OneSignal / Firebase or any external push provider.
- iOS push without an installed PWA (platform limitation, not a choice).
- Unread-count sync via push; bell/inbox UI changes; email duplication.
- `Notification` model changes (no `type` field; push payload derived from title/message/link).

## Capabilities

### New Capabilities
- `web-push-notifications`: backend push dispatch from the chokepoints, `PushSubscription` storage + endpoints, frontend subscription lifecycle, expired-subscription pruning, VAPID configuration.
- `pwa-installability`: manifest + icons, service worker registration, iOS 16.4+ home-screen installability.

### Modified Capabilities
None — bell/inbox requirements (`favorites-notifications-integration`) and migration discipline (`data-schema-migrations`) are followed, not changed.

## Approach

Approach 1 from exploration: `web-push` + Prisma `PushSubscription` (upsert by endpoint), per-user targeting via `userId`, fire-and-forget sends deferred past transaction commit. Chosen over EventEmitter decoupling (indirection without benefit at this scale) and SaaS providers (external dependency, subscription data off-server). **Isolation contract: push dispatch MUST NEVER break, delay, or roll back notification creation** — send failures are logged and swallowed, and push runs off the request hot path.

## Business Rules

1. Subscriptions accepted only for authenticated users (JWT).
2. Permission requested from a user gesture — post-login consent banner, never silent on boot. (Shipped UI strings must be Spanish.)
3. Logout: best-effort unsubscribe; stale endpoints reconciled by upsert on next login.
4. Admin fan-out = N sends (one per admin subscription).
5. Expired subscriptions (HTTP 404/410) pruned on send.
6. VAPID private key never reaches the frontend; public key only via `VITE_VAPID_PUBLIC_KEY`.

## Affected Areas

| Area | Impact | Change |
|------|--------|--------|
| `backend/prisma/schema.prisma` | Modified | `PushSubscription` model + migration |
| `backend/src/notifications/notifications.service.ts` | Modified | push dispatch after create |
| `backend/src/push-notifications/` | New | send + prune service, subscription controller, VAPID config |
| `backend/src/app.module.ts`, `backend/.env.example`, `render.yaml` | Modified | module wiring + 3 VAPID vars |
| `costura-app/public/` (`sw.js`, manifest, icons) | New | SW push/click handlers, installability |
| `costura-app/src/main.jsx`, `providers.jsx`, `index.html` | Modified | SW registration, `PushProvider`, manifest link |
| `costura-app/.env.local`, `.env.production` | Modified | `VITE_VAPID_PUBLIC_KEY` |
| backend `test/`, frontend tests | Modified/New | extend notifications specs; mock PushManager/Notification (jsdom lacks them) |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| iOS push requires installed PWA (16.4+) — CRITICAL scope risk RESOLVED by including PWA; residual: users must discover add-to-home-screen | Med | install hint UI + Spanish docs |
| Permission prompt without user gesture is blocked | Med | consent banner wired to gesture |
| jsdom lacks Notification/PushManager/serviceWorker; smoke tests must guard `navigator.serviceWorker` | Med | comprehensive mocks + guards |
| Chokepoint edits must not break existing backend specs — `notifications.service.spec.ts`, `notifications.e2e.spec.ts`, `lesson-comments.notifications.spec.ts` exist today (exploration's "zero backend tests" is stale); verify gate is `npm test` in both apps + `npm run build`, not lint-only | Med | extend existing DB-free mock patterns |
| Expired subscriptions accumulate | Low | prune on 404/410 |
| Logout DELETE races synchronous sessionStorage clear | Low | endpoint-upsert on next login |
| VAPID private key leakage | Low | backend-only env; review-enforced |

## Rollback Plan

Additive and isolated: remove `PushNotificationsModule` from `app.module.ts` and the push calls from the two chokepoint methods — the bell keeps working (isolation contract guarantees no coupling). Frontend: remove `PushProvider`, SW registration, and manifest link. Drop the `PushSubscription` table via a revert migration (or leave it — holds no user content). Env vars may remain unused.

## Dependencies

- `web-push` (+ `@types/web-push`) — new backend dependency; VAPID keypair via `npx web-push generate-vapid-keys`. No new infrastructure.

## Success Criteria

- [ ] Logged-in user subscribes via consent banner and receives a device push on notification creation (admin reply, purchase approval).
- [ ] Admins receive pushes for student questions / purchase requests.
- [ ] Push send failure never breaks notification creation (isolation contract).
- [ ] 404/410 subscriptions pruned, no junk rows.
- [ ] Site installable as PWA on iOS 16.4+; push delivered after home-screen install.
- [ ] Backend + frontend `npm test` pass; VAPID private key absent from frontend bundle.

## Open Questions

None — the single open scope decision (PWA/iOS inclusion) was resolved by the user before this proposal: **PWA + iOS included.**
