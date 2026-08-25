# Archive Report — functional-bugfixes

## Change

- **Name**: `functional-bugfixes`
- **Archived**: 2026-08-24 → `openspec/changes/archive/2026-08-24-functional-bugfixes/`
- **Artifact store**: hybrid (OpenSpec files + Engram)
- **Verdict at close**: **PASS WITH WARNINGS** — 18/18 requirements, 42/42 scenarios compliant; 0 CRITICAL, 0 blockers (per `verify-report.md` and Engram observation #56; natively admitted by `gentle-ai sdd-verify-validate`: valid=true, verdict pass, `evidence_revision` sha256:97ed10cd7fc15baf9dff5ebad78aeb204f5d8214d06fe6df5ba7fae505e15dce)

## Final State (at close)

The SDD cycle is complete. This report is the terminal record and reflects the state of the change AT CLOSE, not at earlier snapshot times. `apply-progress` (#54) and `verify-report` (#56) are intermediate snapshots; work continued after each was persisted, and the orchestrator forwarded final-state facts that outrank them (authority: native review status > persisted tasks artifact > orchestrator final-state facts > intermediate snapshots).

- **What shipped**: 6 chained PRs, all merged into `dev` — pr1-access-security (#11 `adc7f5d`), pr2-auth-admin (#12 `bf57125`), pr3-profile (#13 `f48f130`), pr4-presentation (#14 `bd1979e`), pr5-reapprove-ui (#15 `2e809f5`, commit `888fc67`), pr6-admin-sales-status (#16 `4fc6859`, commit `73869a6`). `origin/dev` head at close: **4fc6859**.
- **Tasks**: 29/29 tasks complete (9 A + 7 B + 5 C + 5 D + PR5 re-approve UI + Slice E 6.1–6.3). Archived `tasks.md` shows all 29 `[x]`; zero unchecked implementation tasks.
- **Verification (per verify-report #56, final run at `4fc6859`)**: backend typecheck/lint/build/jest exit 0 (7 suites / 32 tests); frontend build exit 0 + vitest exit 0 (5 files / 33 tests); frontend lint exit 1 at 17 problems (15 errors + 2 warnings) — pre-existing baseline, ZERO new.
- **Post-verify work completed after intermediate snapshots were persisted** (final-state facts, outrank the snapshots): PR5 and PR6 merged into `dev`; the PR6 bug fix (REJECTED purchases hidden from the sales table) shipped at `4fc6859`; the admin curl suite (7/7 PASS) closed all 5 previously-PARTIAL admin-gated scenarios; final verification re-run PASS WITH WARNINGS at `4fc6859`.

## PR Chain (#11–#16)

| PR | Branch | Merge commit | Contents |
|----|--------|--------------|----------|
| #11 | pr1-access-security | `adc7f5d` | Paywall projection + lesson/purchase/progress guards + reversible approve/deny + unlock notification + coordinated frontend fetch (Slice A, tasks 1.1–1.9) |
| #12 | pr2-auth-admin | `bf57125` | CORS restricted to computed origins, backend eslint config, reset-password flow, dead api.js helpers removed, mail locale, country required (Slice B, tasks 2.1–2.7) |
| #13 | pr3-profile | `f48f130` | PATCH /users/:id profile self-edit + 409 email conflict contract (Slice C, tasks 3.1–3.5) |
| #14 | pr4-presentation | `bd1979e` | Level badge map, getImageUrl media abstraction, placeholder covers, purchase email removed (Slice D, tasks 4.1–4.5) |
| #15 | pr5-reapprove-ui | `2e809f5` (commit `888fc67`) | `AdminSales.jsx` status column (Aprobada/Pendiente/Denegada badges) + Denegar/Reaprobar actions with confirm dialogs — UI layer for the approve/reject lifecycle |
| #16 | pr6-admin-sales-status | `4fc6859` (commit `73869a6`) | Slice E (tasks 6.1–6.3): sales status list fix (see below) |

## PR5 + PR6 History and the Bug PR6 Fixed

- **PR5** delivered the UI layer for the approve/reject lifecycle: `AdminSales.jsx` gained a status column rendering Aprobada/Pendiente/Denegada badges plus Denegar/Reaprobar actions with confirm dialogs.
- **Bug found by the owner after PR5**: `getAllPurchases()` in `backend/src/purchases/purchases.service.ts` filtered `status: APPROVED`, so REJECTED purchases vanished from the sales table and the "Reaprobar" button never rendered — the UI handled REJECTED, but the backend never sent it.
- **PR6 fix (merged `4fc6859`)**: `getAllPurchases` now returns all non-deleted purchases (status filter dropped, `deletedAt: null` kept); `AdminSales.jsx` financial summaries (revenue cards, total sales count, per-course chart) count only APPROVED while the detail table shows every status with badge + Denegar/Reaprobar. Tasks 6.1–6.3 added to tasks.md and completed. Financial truth preserved: summaries APPROVED-only, table = source of truth for statuses.

## Admin Curl Suite Evidence (2026-08-24)

Executed 7/7 PASS against the live dev backend (`http://localhost:3000/api`) with the owner's real admin credentials (`backend/.env` `ADMIN_EMAIL` daiana@grow.com + `ADMIN_PASSWORD`, updated by the owner). Temporary student + purchase + notifications cleaned up afterward.

| # | Check | Result |
|---|-------|--------|
| 1 | Admin `PATCH /purchases/:id/approve` | ✅ 200 |
| 2 | Lesson accessible for approved student `GET /lessons/cmsalxjkx0001110x67x43fi4` (course cmr83mmog0001lmze75a5bz8k) | ✅ 200 |
| 3 | Unlock notification row created — `GET /notifications` returned rows titled "Acceso desbloqueado" | ✅ 200 + row |
| 4 | Admin `PATCH /purchases/:id/reject` | ✅ 200 |
| 5 | Lesson after deny | ✅ 403 for the student |
| 6 | Admin re-approve `PATCH /purchases/:id/approve` | ✅ 200 |
| 7 | Lesson after re-approve | ✅ 200 |

This closed all 5 previously-PARTIAL admin-gated scenarios (approve/deny/re-approve/unlock-notified/no-notification-on-deny) — per `verify-report` #56, the final-state claim supersedes the PARTIAL markers recorded in earlier apply-progress snapshots.

## Specs Synced

| Domain | Action | Details |
|--------|--------|---------|
| access-control-ownership | Updated (merge) | Main spec existed (2 requirements from 2026-08-21-code-quality-refactor). Delta ADDED 6 requirements (payload projection, lesson guard, purchase ownership, progress check, approve/revoke lifecycle, unlock notification) — appended verbatim; existing 2 requirements preserved. Now 8 requirements. |
| auth-admin-security | Updated (merge) | Main spec existed (2 requirements). Delta ADDED 2 (CORS restricted to computed origins, reset-password flow completion). Now 4 requirements. |
| profile-purchase-history | Updated (merge) | Main spec existed (1 requirement). Delta ADDED 3 (profile self-edit, country required, email-uniqueness 409 contract). Now 4 requirements. |
| mail-service | Updated (merge) | Main spec existed (2 requirements). Delta ADDED 2 (no purchase email, reset-password email language by country). Now 4 requirements. |
| course-catalog-presentation | Created (new main spec) | No main spec existed; the delta spec was a full spec (3 requirements, 7 scenarios) and was promoted mechanically (shell `Copy-Item` → `git diff --no-index` byte-identity → `Move-Item`). |
| code-quality-hygiene | Created (new main spec) | No main spec existed; the delta spec was a full spec (2 requirements, 4 scenarios) and was promoted mechanically. |

All deltas were ADDED-only (no MODIFIED/REMOVED/RENAMED requirements), so no destructive merge occurred and config `rules.archive` ("Warn before merging destructive deltas") was not triggered. Existing requirements not mentioned in the deltas were preserved verbatim in every merged spec.

## Archive Contents

- `proposal.md` ✅
- `specs/{access-control-ownership,auth-admin-security,profile-purchase-history,mail-service,course-catalog-presentation,code-quality-hygiene}/spec.md` ✅ (6 delta specs, unchanged from the change folder)
- `design.md` ✅
- `tasks.md` ✅ (29/29 tasks complete, zero unchecked)
- `verify-report.md` ✅
- `archive-report.md` ✅ (this file, additive-only)

NOTE: the change folder did not contain an `exploration.md` (the explore-phase output lives in Engram only, observation #49) — this matches the folder as authored; not a missing artifact.

## Risks / Deviations Carried Forward (non-blocking)

Per `verify-report` #56 WARNINGs (valid at close; no higher-ranked source supersedes them):

1. **Frontend lint exits 1 (pre-existing debt)** — 17 problems (15 errors, 2 warnings) at `4fc6859`, identical to the PR5-measured baseline at `2e809f5`; diff-verified ZERO new (the two `AdminSales.jsx` findings predate PR6). A separate hygiene slice owns the baseline.
2. **Browser manual pass not run by agents** — owned-learning view (video/PDF/attachments rendering), profile edit persist-across-reload visual pass, and reset-email E2E (N/A in dev: `MAIL_ENABLED=false`) were not executed by agents. API-level equivalents verified (lesson 200/403, notification row, PATCH 200 + reload persist, reset endpoint reachable). Visual/browser layer remains a manual follow-up.
3. **Backend lint `no-explicit-any` warnings (48)** — pre-existing codebase debt; candidate for a follow-up typing sweep.
4. **Vite build rolldown ESM-interop warning dump** — harmless but noisy; can be silenced with a build config tweak.
5. **No automated tests for the approve/reject/re-approve notification path** — verification depended on the owner-credential manual curl run; adding Jest/Supertest RED cases (per design's Testing Strategy) is the suggested follow-up.
6. **E5 plaintext admin password** — dev-only, gitignored, out of scope; the owner updated `backend/.env` themselves. Not touched by this change.

## Next Steps

- **Owner**: browser manual pass — owned-learning view, profile edit visual reload, reset-email E2E once SendGrid/`MAIL_ENABLED` are configured (documented follow-up).
- **Future cleanup slice**: frontend lint debt (17 problems), backend `no-explicit-any` (48 warnings), Vite build warning silencing.
- **Future hardening**: automated Jest/Supertest for guard + notification paths.
- **Repo hygiene (from prior archives, still open)**: `openspec/config.yaml` stale verify `test_command: ""`; root `README.md` UTF-16-LE + missing `MAIL_ENABLED` row; dependency audit; unused `.ttf` fonts; dead `AdminContext.deleteUser`; modularization candidates.
- **Nothing committed by the archive phase** (per instructions). The `openspec/` working-tree changes (promoted/merged specs, archived folder, prior design-system-overhaul deletions) remain uncommitted per repo convention.

## Mechanical Integrity (diff -r readbacks)

All copies/moves performed with native shell binaries (`Copy-Item`/`Move-Item` on PowerShell); byte-identity verified with `git diff --no-index`, the reliable Windows equivalent of `diff -r` (same convention as the 2026-08-24-design-system-overhaul archive). Verbatim readback results:

- **Spec promotion** (`openspec/changes/functional-bugfixes/specs/course-catalog-presentation/spec.md` → `openspec/specs/course-catalog-presentation/spec.md`): `(empty diff)` → `DIFF_STATUS=0` → `READBACK_STATUS=0` → `PROMOTED_OK`.
- **Spec promotion** (`openspec/changes/functional-bugfixes/specs/code-quality-hygiene/spec.md` → `openspec/specs/code-quality-hygiene/spec.md`): `(empty diff)` → `DIFF_STATUS=0` → `READBACK_STATUS=0` → `PROMOTED_OK`.
- **Archive move** (pre-move recursive snapshot vs `openspec/changes/archive/2026-08-24-functional-bugfixes/`): `SNAPSHOT_CREATED` → `MOVED_VIA=Move-Item (git mv not applicable for untracked dir)` → `SOURCE_GONE_OK` → `(empty diff)` → `READBACK_STATUS=0` → `ARCHIVE_MOVE_OK`.

The `archive-report.md` file is additive-only and excluded from the comparison (it did not exist in the source snapshot). All readbacks were zero; no truncation or alteration occurred.

## Traceability (Engram observation IDs read)

- `#49` — `sdd/functional-bugfixes/explore` (full content)
- `#50` — `sdd/functional-bugfixes/proposal` (full content)
- `#51` — `sdd/functional-bugfixes/spec` (full content)
- `#52` — `sdd/functional-bugfixes/design` (full content)
- `#53` — `sdd/functional-bugfixes/tasks` (full content; 26/26 original tasks; Slice E 6.1–6.3 confirmed complete via #54 and the filesystem `tasks.md` 29/29)
- `#54` — `sdd/functional-bugfixes/apply-progress` (PR6 Slice E; 29/29 total stated)
- `#56` — `sdd/functional-bugfixes/verify-report` (full content; final PASS WITH WARNINGS)

No review artifacts exist (`reviews/` directory absent in the change folder; `reviewGate` structurally absent in native status), so none were read.

## Gate Notes

- **Native Review Receipt Gate**: `reviewGate` structurally absent (no review ever started for this candidate; `reviews/` absent; launch status: verify all_done, archive ready, 29/29 tasks, no blocked reasons). Archive proceeded under ordinary repository policy.
- **Task Completion Gate**: persisted `tasks.md` (source of truth for openspec/hybrid) shows 29/29 `[x]`, zero unchecked implementation tasks; no archive-time reconciliation was required.
- **CRITICAL gate**: `verify-report.md` has 0 CRITICAL findings; no block.
- **Action context**: no `workspace-planning` mode reported; no `allowedEditRoots` restriction beyond the workspace. All archive operations stayed inside `openspec/` under the repo root. No source code modified by the archive phase (backend/ and costura-app/ untouched). Nothing committed. The pre-existing uncommitted design-system-overhaul archive working-tree files were left as-is.