```yaml
schema: gentle-ai.verify-result/v1
evidence_revision: sha256:fb14dc2e811957fdbeb553bee5ba0bc7e49ad09922c0b190c4533043e4c1ea42
verdict: pass_with_warnings
blockers: 0
critical_findings: 0
requirements: 14/14
scenarios: 25/25
test_command: backend `npm test` (workdir backend/) && frontend `npm test` (workdir costura-app/)
test_exit_code: 0
test_output_hash: sha256:7a95069523830db7041bbab2a80753670e31795f6afe19bfd5f2b7367e91d99f
build_command: backend `npm run lint` && `npm run typecheck` && `npm run build` (backend/) && frontend `npm run lint` && `npm run build` (costura-app/)
build_exit_code: 0
build_output_hash: sha256:f72babcc9a51ae1abd7eafeefc046e3c561d6c11208a04f9115d837d5b486bfc
```

## Verification Report

**Change**: web-push-notifications
**Version**: N/A (delta specs: web-push-notifications 6 req / 13 scenarios; pwa-installability 8 req / 12 scenarios)
**Mode**: Standard (strict_tdd: false)
**Verification target**: `dev` (HEAD `e1cae0c`, Merge PR #32) — RE-RUN after chain integration
**Previous attempt**: FAIL (change not integrated; only WU1/PR #27 was on `dev`)

### Launch Premise Check (MANDATORY) — PASS

The premise that previously failed this verify is now confirmed against git ancestry and the working tree:

- **Ancestry**: all 11 WU1–WU5 commits (`da4ce67`, `b2cbe7b`, `8aa93dd`, `85d3f42`, `06d8e4e`, `3035691`, `3ca2ff8`, `5f6f54d`, `18a8ef8`, `bbe615a`, `ab8f13f`) are ancestors of `e1cae0c` (`git merge-base --is-ancestor` — all exit 0).
- **Tree delta** brought by the integration merge (`ade5696..e1cae0c`): **28 files, +1898/-24** — dispatcher tests, PushContext, PushProvider tests, sw.js, manifest, icons, env docs, render.yaml VAPID vars — all present on `dev`.
- **File presence** (working tree at `e1cae0c`): `backend/test/notifications-dispatcher.spec.ts` ✅, `costura-app/src/context/PushContext.jsx` ✅, `PushProvider.test.jsx` ✅, `public/sw.js` ✅, `public/manifest.json` ✅, `backend/src/push-notifications/*` module ✅, root `render.yaml` (VAPID block, +8) ✅, `backend/README.md` VAPID note ✅, `backend/.env.example` VAPID block ✅.
- No missing WU1–WU5 file was found. Verification proceeds (no false green this time).

### Completeness

| Metric | Value |
|--------|-------|
| Tasks total (tasks.md) | 26 (WU1 9 + WU2 4 + WU3 4 + WU4 5 + WU5 4) |
| Tasks checked `[x]` | 26 |
| Tasks whose code is on `dev` | 26 (full chain integrated via PRs #27 + #32) |

### Build & Tests Execution (on `dev` @ e1cae0c)

**Build/lint/typecheck**: ✅ all exit 0
```text
backend:  npm run lint (0) — eslint "src/**/*.ts" --fix made 0 tree changes (git status clean)
          npm run typecheck (0) — tsc --noEmit
          npm run build (0) — nest build
frontend: npm run lint (0) — eslint .
          npm run build (0) — vite build, 1852 modules, 3.05s
```

**Tests**: ✅ exit 0 — **counts EXCEED the pre-merge baselines**, proving the change is covered on this tree:
```text
backend:  Test Suites: 13 passed, 13 total   (baseline 12 → +1: notifications-dispatcher.spec.ts)
          Tests:       99 passed, 99 total   (baseline 90 → +9: dispatcher suite)
frontend: Test Files:  17 passed (17)        (baseline 14 → +3: PushProvider.test.jsx, api.push.test.js, AuthContext.test.jsx pre-clear block)
          Tests:       123 passed (123)      (baseline 103 → +20)
```

**VAPID dist hygiene** (fresh `vite build`, 26 dist files scanned): private-key value occurrences **0**; `VAPID_PRIVATE_KEY` literal occurrences **0**; public key inlined **1** (expected — `applicationServerKey`). Repo-wide `git grep` of the private value over tracked files: only `backend/src/push-notifications/vapid.config.ts`, which holds the **documented throwaway TEST_VAPID constant gated to `NODE_ENV=test`** (never used to send; every `web-push` call is mocked in tests). `backend/.env` and `costura-app/.env.local` are git-ignored.

**Runtime smoke (live HTTP)**: in-process e2e suites (`push-subscriptions.e2e.spec.ts` over the Nest app) cover POST 201 / upsert / 401 / DELETE 204/403/404; no live booted-backend curl smoke was run this session (unchanged from prior attempts; manual-verification-only lane).

### Spec Compliance Matrix

**web-push-notifications (6 req / 13 scenarios)** — 12 scenarios runtime-passed, 1 static-only:

| Requirement | Scenario | Evidence (test/code) | Result |
|-------------|----------|----------------------|--------|
| R1 PushSubscription Persistence | Two devices → second row | `push-notifications.service.spec.ts` "sends one push per subscription": seeds `device-1`+`device-2` for user-1, asserts 2 rows served / 2 sends | ✅ PASS (runtime) |
| R1 | Repeated subscribe same endpoint → upsert | e2e "POST upserts same endpoint instead of duplicating"; service "upserts instead of duplicating" | ✅ PASS (runtime) |
| R1 | User account deleted → cascade | Prisma `onDelete: Cascade` (schema.prisma:213) + migration DDL `ON DELETE CASCADE` (verified); **no covering delete-user test** | ⚠️ STATIC (DDL/declarative only) |
| R2 JWT-Guarded Endpoints | Authenticated subscribe 201 | e2e "POST … returns 201 and stores" | ✅ PASS (runtime) |
| R2 | Unauthenticated → 401 | e2e POST 401 + DELETE 401 | ✅ PASS (runtime) |
| R2 | Delete another user's → 403 | e2e DELETE 403; service "rejects a non-owner with 403" | ✅ PASS (runtime) |
| R3 Chokepoint Dispatch (isolation) | Push fails, notification still works | `notifications-dispatcher.spec.ts` "still resolves creation when the deferred push send fails"; service "logs and swallows non-expired send errors" | ✅ PASS (runtime) |
| R3 | Transaction rolls back → no push | dispatcher "does not dispatch when the notification create fails (rollback sends none)" | ✅ PASS (runtime) |
| R3 | Notification with link payload | dispatcher "derives the payload with url from the link"; "omits data.url when no link" | ✅ PASS (runtime) |
| R4 Per-User + Admin Fan-Out | Multi-device user → 2 pushes | service fan-out (device-1/device-2 → 2 `sendNotification` calls) + "wires the seam end-to-end" | ✅ PASS (runtime) |
| R4 | Admin fan-out = N sends | dispatcher "dispatches once per admin notification (fan-out)"; "dispatches nothing when there are no admins" | ✅ PASS (runtime) |
| R5 Expired Subscription Pruning | 410 pruned mid-fan-out, rest continue | service "prunes an expired subscription (410) and keeps fanning out"; "prunes a 404 endpoint as well" | ✅ PASS (runtime) |
| R6 VAPID Hygiene | Private key never exposed | dist grep **0** private occurrences (fresh build, this run); no endpoint serves VAPID; `.env` git-ignored; public key inlined | ✅ PASS (runtime grep) |

**pwa-installability (8 req / 12 scenarios)** — 8 scenarios runtime-passed, 4 static (browser/SW-lane, spec R8 acknowledges jsdom cannot run SW):

| Requirement | Scenario | Evidence (test/code) | Result |
|-------------|----------|----------------------|--------|
| R1 PWA Manifest + Icons | Manifest served and linked | `manifest.json` (name, short_name, icons 192/512/maskable, start_url, standalone, theme_color); `index.html` manifest link + `apple-touch-icon`; icons built into dist | ⚠️ STATIC (installability needs a real browser) |
| R2 Service Worker Registration | Push while app closed | `sw.js` `push` handler → `showNotification(payload title/body/icon/data.url)`; registration tested via smoke | ⚠️ STATIC (SW events not runnable in jsdom) |
| R2 | Push while app open | `sw.js` `notificationclick` → `clients.matchAll` + `navigate`/`focus` existing window | ⚠️ STATIC |
| R2 | Click opens target (origin prepended) | `sw.js` `toAbsoluteUrl` = `new URL(pathOrUrl, self.registration.scope)` | ⚠️ STATIC |
| R3 Gesture-Wired Consent | Logged-in user consents | `PushProvider.test.jsx` "accepting the banner requests permission and subscribes with the VAPID key" | ✅ PASS (runtime) |
| R3 | Not logged in | "does not prompt nor subscribe when there is no authenticated user" | ✅ PASS (runtime) |
| R3 | Permission denied | "denying permission creates no subscription and does not ask again"; "dismissing with Ahora no … stays dismissed" | ✅ PASS (runtime) |
| R4 Login Upsert Reconciliation | Stale endpoint healed | "upserts an existing subscription on login without prompting (upsert heal)" | ✅ PASS (runtime) |
| R5 Best-Effort Logout | Logout DELETE races session clear | "fires a best-effort DELETE on logout with the token still present (pre-clear)"; "swallows a failed logout DELETE … next-login heal"; `AuthContext.test.jsx` pre-clear listener tests | ✅ PASS (runtime) |
| R6 Frontend VAPID Public Key | Public key as applicationServerKey | banner-accept test subscribes with key; `api.push.test.js` wire format; `.env.production` public only | ✅ PASS (runtime) |
| R7 Spanish Consent/Install Copy | Banner shows Spanish copy | banner file strings byte-match spec; presentational "exact Spanish copy" tests | ✅ PASS (runtime) |
| R8 jsdom Test Constraints | Smoke without service worker | smoke "does not throw when navigator.serviceWorker is unavailable"; "registers sw.js when available" | ✅ PASS (runtime) |

**Compliance summary**: 25/25 scenarios satisfied. 20/25 have a passing runtime covering test; 5/25 are satisfied by in-tree static/declarative evidence (web-push R1 cascade DDL; pwa R1 manifest/install and R2 SW event handlers) whose evidence-type caveats are listed as SUGGESTIONs below. No scenario is unimplemented or contradicted.

### Correctness (Static Evidence)

| Area | Status | Evidence |
|------|--------|----------|
| R1 model + migration | ✅ | `PushSubscription` (unique endpoint, p256dh/auth, userAgent?, timestamps, `@@index([userId])`, `@@map`) + migration `20260908230041_add_push_subscriptions` present and applied (WU1) |
| R2 endpoints | ✅ | `@Controller('push-subscriptions')` + `JwtAuthGuard`; POST 201 / DELETE 204/404/403; owner-or-admin check |
| R3 chokepoints | ✅ | `createNotification`/`createNotificationsForAdmins` → `schedulePush` → `setImmediate` + catch/log; optional `@Optional() @Inject(PUSH_DISPATCHER)` seam |
| R4 fan-out | ✅ | `sendToUser` → per-target `fanOut`; one send per subscription; module adapter derives payload |
| R5 pruning | ✅ | `isExpiredSubscription` 404/410 → delete row + continue |
| R6 VAPID backend | ✅ | Fail-fast `vapidConfig`; TEST_VAPID only under `NODE_ENV=test`; throws otherwise |
| pwa R1–R8 | ✅ | manifest/icons/link; sw.js handlers; guarded boot registration; PushProvider under AuthProvider; pre-clear logout; upsert heal; Spanish copy; env-key guard |

### Coherence (Design)

| Decision (design.md) | Followed? | Evidence |
|----------------------|-----------|----------|
| Optional `PushDispatcher` seam, explicit DI token | ✅ | `PUSH_DISPATCHER` token + `@Optional()` param; direct `new NotificationsService(prisma)` specs stay green |
| `setImmediate` post-commit, fire-and-forget | ✅ | `schedulePush`; dispatcher e2e asserts deferred-past-commit and rollback-sends-none |
| Endpoint-unique upsert identity | ✅ | `upsert` on `endpoint`; owner/keys refreshed (heals raced logout) |
| Payload `{ title, body: message, data: { url: link } }` | ✅ | Module adapter; `url` present iff link supplied |
| PushProvider directly under AuthProvider; gesture-only consent | ✅ | `providers.jsx`; banner-only `requestPermission` |
| VAPID fail-fast + test fallback | ✅ | `vapid.config.ts` |

### Issues Found

**CRITICAL** — none.

**WARNING**
1. **WU4 size overage (carry-forward)** — PR #4 diff was +1,158/-17 vs ~380 forecast, over the 400-line review guard with no `size:exception` recorded at apply time. Content re-audited against the pwa-installability spec (R3–R8) and design: **no scope drift** — bulk is the scenario-mandated `PushProvider.test.jsx` (428) + `PushContext.jsx` (296) + jsdom mock scaffolding. Process/oversight record only; no code defect.
2. **VAPID TEST pair placeholder (carry-forward)** — throwaway keypair constant in `vapid.config.ts` (`NODE_ENV=test` gate) whose public half is committed to `costura-app/.env.production` (commented PLACEHOLDER) and used in local `backend/.env` (gitignored). Dist hygiene verified (0 occurrences); **production must regenerate** via `npx web-push generate-vapid-keys` and set real values in the Render dashboard (`render.yaml` `sync: false`) + frontend `.env.production` before deploy. No leakage; deploy-time action required.

**SUGGESTION**
1. web-push R1 "account deleted → cascade" is enforced declaratively (DDL `ON DELETE CASCADE`) but has no covering test that deletes a user row and asserts subscription removal — add an e2e when a user-deletion endpoint exists.
2. pwa R1/R2 (manifest installability; SW push/notificationclick runtime) are verified statically + by registration smoke + prior preview harness; a browser-level test (Playwright) would lock click-to-open/URL-resolution behavior. Spec R8 keeps these out of the jsdom suite by design.

### Verdict

**PASS WITH WARNINGS** — the change is fully integrated on `dev` (`e1cae0c`), all 26 tasks are complete, all declared commands exit 0, runtime counts exceed the pre-merge baselines (backend 12→13 suites / 90→99 tests; frontend 14→17 files / 103→123 tests), 20/25 spec scenarios have passing covering tests and the remaining 5 are statically verified with no contradiction, and the implementation matches the design decisions 1:1. The two WARNINGS are carried-forward deploy-time/process items (VAPID placeholder rotation, WU4 size:exception) and do not block archive.

### Carry-Forward for Archive/Deploy

- Rotate the VAPID pair for production (render.yaml `sync: false`; `.env.production` placeholder) before the first real push.
- Record the WU4 size:exception retroactively in the change record.
- Optional: cascade e2e + browser-level SW test as future hardening.
