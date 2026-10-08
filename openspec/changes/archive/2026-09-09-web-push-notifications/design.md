# Design: Web Push Notifications

## Technical Approach

Add a NestJS `PushNotificationsModule` backed by `web-push` and Prisma, with an optional dispatcher injected into both notification chokepoints. Persistence stays synchronous; dispatch is deferred and swallowed. React registers one service worker at boot; authenticated `PushProvider` owns consent and reconciliation. `Notification` and bell behavior remain unchanged.

## Architecture Decisions

| Decision | Choice | Alternatives rejected | Rationale |
|---|---|---|---|
| Dispatch seam | Optional `PushDispatcher`; `NotificationsModule` imports/exports `PushNotificationsModule`. | Inline calls; event emitter | Mockable, preserves `new NotificationsService(mockPrisma)` tests, and avoids a hidden global contract. |
| Post-commit isolation | `setImmediate(() => void dispatch(...).catch(log))` after create resolves. Prisma completes the transaction callback and commit before the next event-loop turn. | `queueMicrotask` can precede commit; awaiting blocks; EventEmitter adds indirection. | Explicit fire-and-forget; send latency/errors cannot affect the caller. |
| Subscription identity | Globally unique `endpoint`; POST upserts endpoint and updates owner/keys/agent. | Composite user/device key | Supports multiple devices and heals raced logout. |

Code-level seam:
```ts
const notification = await client.notification.create({ data });
this.pushDispatcher?.schedule(notification.userId, notification.title,
  notification.message, notification.link);
return notification;
```
`createNotificationsForAdmins` schedules once per created admin notification. Dispatcher payload is `{ title, body: message, data: { url: link } }`; each target is isolated, and 404/410 deletes that row before continuing.

## Data Flow

`POST /push-subscriptions` → JWT guard → `PushSubscriptionService.upsert` → Prisma

`createNotification(s)` → transaction → `setImmediate` → subscription query → `web-push.sendNotification` → service worker → click opens/focuses `data.url`.

## File Changes

| File | Action | Description |
|---|---|---|
| `backend/prisma/schema.prisma`, `backend/prisma/migrations/*_add_push_subscriptions/migration.sql` | Modify/Create | `PushSubscription { id cuid, userId, endpoint @unique, p256dh, auth, userAgent?, createdAt, updatedAt }`; cascade FK, `userId` index, `add_push_subscriptions` migration. |
| `backend/src/push-notifications/{push-notifications.module.ts,push-notifications.controller.ts,push-notifications.service.ts,dtos/*}` | Create | Fail-fast VAPID service, guarded POST/DELETE, validation, dispatch/pruning; encoded endpoint and owner/admin check. Background errors log and swallow. |
| `backend/src/notifications/{notifications.module.ts,notifications.service.ts}`, `backend/src/app.module.ts` | Modify | Optional dispatcher injection and module wiring; no required test-constructor break. |
| `backend/package.json`, `.env.example`, `render.yaml`, `README.md` | Modify | `web-push`; three VAPID vars (`sync: false`); document `npx web-push generate-vapid-keys`. |
| `costura-app/public/{manifest.json,sw.js,icons/*}` and `index.html` | Create/Modify | Standalone manifest; SW push/click handlers; relative links gain `location.origin`. |
| `costura-app/src/main.jsx`, `src/components/providers.jsx`, `src/context/{AuthContext.jsx,PushContext.jsx}`, `src/components/PushConsentBanner.jsx`, `.env.local`, `.env.production` | Create/Modify | Guarded registration; `PushProvider` directly under `AuthProvider`; gesture-only Spanish consent. Pre-clear logout event carries token for best-effort DELETE; user-keyed localStorage and login upsert heal races. |

## Interfaces / Contracts

DTO: `{ endpoint: string, keys: { p256dh: string, auth: string }, userAgent?: string }`. POST returns 201; DELETE returns 204, 404 absent, 403 cross-owner. `PushProvider` requires user, permission, worker readiness, and `VITE_VAPID_PUBLIC_KEY`; it never prompts on boot. UI: “Activa las notificaciones”; “Recibe avisos de respuestas, compras y novedades incluso sin estar en la página.”; “Activar”; “Ahora no”; “Instala la aplicación en tu pantalla de inicio para recibir notificaciones.”

## Testing Strategy

| Layer | What to Test | Approach |
|---|---|---|
| Unit | Dispatcher isolation, payload, 404/410 pruning and fan-out | Extend DB-free Jest mocks; assert notification resolves before rejected send and remaining sends continue. |
| Existing | Three notification specs | Keep constructors/transaction mocks compatible; run backend `npm test`, typecheck, build. |
| Frontend | Provider login/consent/upsert/logout; SW absence | Vitest mocks for `Notification`, `PushManager`, registration; smoke guard `navigator.serviceWorker`. |
| E2E | Commit timing | Await transaction completion, flush immediate timers, then assert sends; separately assert rollback sends none. |

## Threat Matrix

All rows are N/A: no documentation execution, Git selection/state, push destination, PR command, shell, subprocess, VCS, or executable boundary changes. Click URLs are constrained to same-origin/app-relative application routes.

## Migration / Rollout

Deploy migration before application rollout; configure VAPID values in backend and public key in frontend. Rollback removes module wiring/calls and may revert the additive table.

## Open Questions

None; PWA/iOS scope and all carried-forward implementation decisions are resolved.

## Work Units

1. Backend model/module/dependency plus unit tests. 2. Chokepoint injection and timing tests. 3. Frontend manifest/SW and registration. 4. Provider, consent, logout/upsert lifecycle and tests. 5. Environment/deploy documentation. Forecast is high against the 400-line budget; with `ask-on-risk`, use these as chained PR slices if authored changes exceed 400 lines.
