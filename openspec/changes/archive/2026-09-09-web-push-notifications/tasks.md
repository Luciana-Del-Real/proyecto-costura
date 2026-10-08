# Tasks: Web Push Notifications

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~1,280 total (WU1 ~480, WU2 ~140, WU3 ~220, WU4 ~380, WU5 ~60) |
| 400-line budget risk | WU1 High; WU2 Low; WU3 Low; WU4 Medium; WU5 Low |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 → PR 2 → PR 3 → PR 4 → PR 5 (stacked to `dev`) |
| Delivery strategy | ask-on-risk |
| Chain strategy | stacked-to-main |

Decision needed before apply: No
Chained PRs recommended: Yes
Chain strategy: stacked-to-main
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | PR | Focused test | Runtime harness | Rollback boundary |
|------|------|----|--------------|-----------------|-------------------|
| 1 | Model+migration+push module (web-push, VAPID, controller/service, prune) | PR 1 | backend `npm test test/push-notifications.service.spec.ts` | `npm run dev`; curl POST /api/push-subscriptions with JWT | Revert `add_push_subscriptions` migration; drop `PushNotificationsModule` import |
| 2 | Optional dispatcher DI + setImmediate post-commit dispatch | PR 2 | backend `npm test test/notifications*.spec.ts` | `npm run dev`; create notification, observe dispatch log | Remove dispatcher calls in both chokepoints; revert module exports |
| 3 | manifest+icons+sw.js+registration | PR 3 | frontend `npm test src/components/smoke.test.jsx` | `npm run dev`; DevTools > Application > Service Workers | Delete public/sw.js, manifest, icons; remove index.html link |
| 4 | PushProvider+consent+subscribe/unsubscribe+login upsert heal | PR 4 | frontend `npm test src/context/PushProvider.test.jsx` | `npm run dev`; login→banner→allow→POST; logout→DELETE | Remove PushProvider+banner; revert providers.jsx; env vars unused |
| 5 | VAPID env/docs/deploy | PR 5 | backend `npm run typecheck`; grep dist for private key | N/A — config-only; grep + review prove it | Remove VAPID vars + README note; keys unused |

## WU1 — Backend model, module, tests (PR 1)

- [x] WU1-01 Add `PushSubscription` model + `pushSubscriptions` relation to backend/prisma/schema.prisma (userId FK cascade, endpoint @unique, p256dh, auth, userAgent?, createdAt/updatedAt, @@index([userId])). Deps: none. Verify: `npm run typecheck`. ~25 lines
- [x] WU1-02 Create migration `add_push_subscriptions` under backend/prisma/migrations/. Deps: WU1-01. Verify: `npm run db:migrate`. ~25
- [x] WU1-03 Add `web-push` + `@types/web-push` to backend/package.json. Deps: none. Verify: `npm install`. ~4
- [x] WU1-04 Create backend/src/push-notifications/vapid.config.ts — fail-fast load of VAPID_PUBLIC_KEY/VAPID_PRIVATE_KEY/VAPID_SUBJECT. Deps: WU1-03. Verify: `npm run typecheck`. ~35
- [x] WU1-05 Create backend/src/push-notifications/push-notifications.service.ts — per-subscription send, isolate targets, delete row on 404/410, log+swallow errors. Deps: WU1-01, WU1-04. Verify: `npm run typecheck`. ~130
- [x] WU1-06 Create push-notifications.controller.ts + dtos/ — POST upsert→201, DELETE :endpoint→204/404, 403 cross-owner, JWT guard. Deps: WU1-05. Verify: `npm run typecheck`. ~110
- [x] WU1-07 Create push-notifications.module.ts; import in backend/src/app.module.ts. Deps: WU1-05. Verify: `npm run build`. ~20
- [x] WU1-08 Write backend/test/push-notifications.service.spec.ts + push-subscriptions.e2e.spec.ts (upsert, 401/403, prune, fan-out). Deps: WU1-05..07. Verify: `npm test`. ~160
- [x] WU1-09 Run backend `npm run lint` + `npm run typecheck` + `npm test` — all green. Deps: WU1-08. Verify: the three commands. ~0

## WU2 — Chokepoint injection (PR 2)

- [x] WU2-01 Add `PushDispatcher` interface + optional constructor param in backend/src/notifications/notifications.service.ts (keeps `new NotificationsService(mockPrisma)` specs green). Deps: WU1-07. Verify: `npm test`. ~25
- [x] WU2-02 Dispatch in createNotification + createNotificationsForAdmins via setImmediate after create; catch+log (isolation contract). Deps: WU2-01. Verify: `npm test`. ~30
- [x] WU2-03 Update notifications.module.ts (import/export PushNotificationsModule). Deps: WU2-02. Verify: `npm run build`. ~10
- [x] WU2-04 Tests: send-failure isolation (creation still resolves), rollback sends none; notifications.service.spec, notifications.e2e.spec, lesson-comments.notifications.spec stay green. Deps: WU2-02. Verify: `npm test`. ~80

## WU3 — Frontend PWA (PR 3)

- [x] WU3-01 Create costura-app/public/manifest.json (name, short_name, icons, start_url, standalone, theme_color) + public/icons/* (iOS-ready); link in index.html. Deps: none. Verify: `npm run build`. ~40
- [x] WU3-02 Create costura-app/public/sw.js — push + notificationclick: open/focus `data.url`, prepend `location.origin` for relative links. Deps: WU3-01. Verify: `npm run build`. ~60
- [x] WU3-03 Register SW in costura-app/src/main.jsx, guarded on `navigator.serviceWorker`. Deps: WU3-02. Verify: `npm test`. ~15
- [x] WU3-04 Extend src/components/smoke.test.jsx — mount app without navigator.serviceWorker, assert no throw. Deps: WU3-03. Verify: `npm test`. ~20

## WU4 — Subscription lifecycle (PR 4)

- [x] WU4-01 Create src/context/PushContext.jsx + PushProvider (user-keyed, never prompts on boot, subscribe with VITE_VAPID_PUBLIC_KEY as applicationServerKey, POST upsert); mount directly under AuthProvider in src/components/providers.jsx. Deps: WU3-03. Verify: `npm test`. ~120
- [x] WU4-02 Create src/components/PushConsentBanner.jsx — gesture-wired; Spanish strings: "Activa las notificaciones" / "Recibe avisos de respuestas, compras y novedades incluso sin estar en la página." / "Activar" / "Ahora no"; install hint "Instala la aplicación en tu pantalla de inicio para recibir notificaciones.". Deps: WU4-01. Verify: `npm test`. ~70
- [x] WU4-03 Logout best-effort DELETE with token captured pre-clear; login upsert heal; user-keyed localStorage. Deps: WU4-01. Verify: `npm test`. ~50
- [x] WU4-04 Add VITE_VAPID_PUBLIC_KEY to costura-app/.env.local and .env.production (never the private key). Deps: none. Verify: `npm run build`. ~2
- [x] WU4-05 Write src/context/PushProvider.test.jsx (mock PushManager + Notification; denied → no subscription) + consent banner test. Deps: WU4-01..03. Verify: `npm test`. ~120

## WU5 — Env/docs/deploy (PR 5)

- [x] WU5-01 Add VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY / VAPID_SUBJECT to backend/.env.example. Deps: none. Verify: `npm run typecheck`. ~4
- [x] WU5-02 Add the 3 VAPID vars with `sync: false` to render.yaml. Deps: none. Verify: review. ~6
- [x] WU5-03 Update backend/README.md — `npx web-push generate-vapid-keys` note + env table. Deps: WU5-01. Verify: review. ~25
- [x] WU5-04 Verify VAPID private key absent from built frontend bundle (`grep -r` dist) and env example matches service keys. Deps: WU5-01..03. Verify: grep. ~0

## Chain Context (apply)

Stacked to `dev`: each PR merges to `dev` in order WU1→WU5; each child diff must show only its own work unit. Commit per work unit; tests+docs live with the unit they verify (work-unit-commits).