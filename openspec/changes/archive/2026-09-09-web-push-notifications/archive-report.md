# Archive Report — web-push-notifications

## Change

- **Name**: `web-push-notifications`
- **Archived**: 2026-09-09 → `openspec/changes/archive/2026-09-09-web-push-notifications/`
- **Artifact store**: both (OpenSpec files + Engram).
- **Verdict at close**: PASS WITH WARNINGS — 0 CRITICAL, 0 blockers. `verify-report.md` was natively admitted by `gentle-ai sdd-verify-validate` (valid=true, verdict `pass_with_warnings`, requirements 14/14, scenarios 25/25, `evidence_revision` sha256:fb14dc2e811957fdbeb553bee5ba0bc7e49ad09922c0b190c4533043e4c1ea42).

## Final State (at close)

The SDD cycle is complete. This report is the terminal record and reflects the state of the change AT CLOSE, not at earlier snapshot times. Authority: native review status > persisted tasks artifact > orchestrator final-state facts > intermediate snapshots (`apply-progress`/`verify-report`).

- **What shipped** (orchestrator final-state facts, outrank the intermediate snapshots): all 5 work units implemented and verified; the stacked PR chain merged to `dev` via PRs #27–#31 plus integration PR #32 (which merged the full chain WU1–WU5 onto `dev`). `dev` head at archive time: **`e1cae0c`** (merge PR #32). All 11 WU1–WU5 commits (`da4ce67`, `b2cbe7b`, `8aa93dd`, `85d3f42`, `06d8e4e`, `3035691`, `3ca2ff8`, `5f6f54d`, `18a8ef8`, `bbe615a`, `ab8f13f`) are ancestors of `e1cae0c`.
- **Tasks**: **26/26 complete** (WU1 9 + WU2 4 + WU3 4 + WU4 5 + WU5 4) per the persisted `tasks.md`, which marks all 26 `[x]` — 0 unchecked. The Engram tasks mirror (obs 88) agrees: 26/26 `[x]`. No stale unchecked implementation tasks exist in the audit trail.
- **Verification (per `verify-report.md`, obs 90 — native final-verify settlement, re-run on `dev` @ `e1cae0c`)**: PASS WITH WARNINGS — 14/14 requirements, 25/25 scenarios satisfied (20 runtime-covered, 5 static-only with evidence). Backend: `npm run lint` / `typecheck` / `build` / `npm test` exit 0 — 13 suites / 99 tests (baseline 12/90). Frontend: `npm run lint` / `build` / `npm test` exit 0 — 17 files / 123 tests (baseline 14/103). VAPID dist hygiene: 0 private-key occurrences in a fresh build. No CRITICAL findings. (The earlier FAIL attempt — only WU1/PR #27 on `dev` — is superseded by this passing re-run.)

## Task Reconciliation

None required. `apply-progress` (obs 89) and the persisted `tasks.md` agree with the final state: all 26 tasks `[x]`, none pending, none stale. No exceptional stale-checkbox reconciliation was performed.

## Specs Synced

Both delta specs are NEW capabilities that were already promoted to `openspec/specs/` during the change (not at archive time — see Promotion decision below). No delta spec exists in the change folder to merge, so no requirement-level merge was required.

| Domain | Action | Details |
|--------|--------|---------|
| web-push-notifications | Created (already promoted — main spec verified current) | 6 requirements, 13 scenarios. Drift check vs. implementation evidence in `verify-report.md`: requirements and scenario count/content match the R1–R6 compliance matrix 1:1. |
| pwa-installability | Created (already promoted — main spec verified current) | 8 requirements, 12 scenarios. Drift check vs. implementation evidence in `verify-report.md`: requirements and scenario count/content match the R1–R8 compliance matrix 1:1. |

**Drift-check result**: no drift. `verify-report.md` PASSes 14/14 requirements and 25/25 scenarios against these exact promoted spec files (the verify compliance matrix names every requirement/scenario present in the main specs), and the verify report file is byte-identical to the natively validated candidate. The promoted main specs are the current source of truth and were NOT modified by this archive.

**Promotion decision & evidence**: the sdd-spec phase wrote both full specs DIRECTLY to `openspec/specs/{domain}/spec.md` (per Engram obs 86, 2026-09-08, and apply-progress obs 89: "openspec live artifacts remain untracked per WU1-WU4 convention (archived/promoted at the end)"). The change folder therefore never contained a `specs/` directory, and no delta-to-main merge step applied. This is a deliberate early-promotion deviation from the standard openspec flow (delta spec in `changes/{name}/specs/` → merged/promoted at archive) and is recorded here for traceability; the outcome matches the repo convention that every shipped capability has a canonical main spec at `openspec/specs/`. Per the repo's archive convention (archived changes keep a `specs/{domain}/spec.md` snapshot — see `2026-08-27-component-modularization/specs/`), byte-identical copies of the two promoted main specs were added to this archive folder as a shipped-state snapshot. `openspec/config.yaml` `rules.archive` ("Warn before merging destructive deltas") was not triggered — no destructive merge occurred.

## Archive Contents

- `proposal.md` ✅
- `specs/web-push-notifications/spec.md` ✅ (byte-identical copy of the promoted main spec)
- `specs/pwa-installability/spec.md` ✅ (byte-identical copy of the promoted main spec)
- `design.md` ✅
- `tasks.md` ✅ (26/26 `[x]`; 0 unchecked)
- `verify-report.md` ✅
- `archive-report.md` ✅ (this file, additive-only)

The active changes directory no longer contains this change (only `archive/` remains).

## Warnings Carried Forward (non-blocking) — recorded retroactively per final-state facts

1. **WU4 size:exception (retroactive record)** — PR #4's diff was +1,158/−17 vs. the ~380-line forecast, over the 400-line review guard. The orchestrator's final-state facts state the size:exception WAS granted by the maintainer during the session but never formally recorded at apply time. Recorded here retroactively to close that process gap: the exception is confirmed granted; the overage was re-audited in verify (no scope drift — bulk is the scenario-mandated `PushProvider.test.jsx` at 428 lines + `PushContext.jsx` at 296 lines + jsdom mock scaffolding). Process/oversight record only; no code defect.
2. **VAPID TEST pair placeholder (deploy-time action)** — the throwaway keypair constant in `backend/src/push-notifications/vapid.config.ts` (gated to `NODE_ENV=test`) is committed; its public half is the commented PLACEHOLDER in `costura-app/.env.production` and the local dev `backend/.env` (gitignored) uses it. Dist hygiene was verified (0 private-key occurrences). **Production MUST regenerate** with `npx web-push generate-vapid-keys` and set real values in the Render dashboard (`render.yaml` `sync: false`) + frontend `.env.production` before the first real push. Documented in `backend/README.md`.

**SUGGESTIONs from verify (future hardening, not blockers)**: (1) web-push R1 "account deleted → cascade" is enforced declaratively (DDL `ON DELETE CASCADE`) with no covering delete-user test — add an e2e when a user-deletion endpoint exists; (2) pwa R1/R2 (manifest installability; SW push/notificationclick runtime) are statically verified — a browser-level test (Playwright) would lock click-to-open/URL-resolution behavior.

## Next Steps (post-archive)

- **Production VAPID rotation** (blocking for first real push): generate a real keypair, set the 3 backend vars in the Render dashboard and the public key in frontend env, per `backend/README.md` and WARNING 2 above.
- **Optional hardening**: cascade-delete e2e; browser-level SW/manifest test.
- **Recommended**: browser e2e on a real installed-PWA device (iOS 16.4+) when a deployed environment exists.

## Mechanical Integrity (readbacks)

All copies/moves performed with native shell binaries (PowerShell `Copy-Item`/`Move-Item`); byte-identity verified with `git diff --no-index` (`-c core.safecrlf=false -c core.autocrlf=false`), the repo's established Windows equivalent of `diff -r` (same convention as prior archives, e.g. `2026-08-27-component-modularization/archive-report.md`). Verbatim readback results:

- **Archive move** (pre-move recursive snapshot of the change folder vs `openspec/changes/archive/2026-09-09-web-push-notifications/`): `git diff --no-index --stat` output shows ONLY the 2 spec-file additions made by the archive phase (the `specs/` snapshot did not exist in the source change folder); the 4 moved files (`proposal.md`, `design.md`, `tasks.md`, `verify-report.md`) have ZERO differences — byte-identical → `ARCHIVE_MOVE_OK`. Source-gone check: `SOURCE_STILL_PRESENT=NO`.
- **Spec snapshot — web-push-notifications** (promoted main spec vs archived copy): `git diff --no-index` exit 0, zero output lines → byte-identical → `SPEC_SNAPSHOT_OK`.
- **Spec snapshot — pwa-installability** (promoted main spec vs archived copy): `git diff --no-index` exit 0, zero output lines → byte-identical → `SPEC_SNAPSHOT_OK`.

The `archive-report.md` file is additive-only and excluded from the comparisons (it did not exist in the source snapshot). All readbacks were zero; no truncation or alteration occurred.

## Traceability

- Engram observation IDs (project `proyecto-costura`): proposal **85**, spec **86**, design **87**, tasks **88**, apply-progress **89**, verify-report **90**, explore **81**. All read in full via `mem_get_observation` except obs 81/85–87 (proposal/spec/design/explore were read from the byte-identical OpenSpec files; obs 86 and 89 were read in full for the promotion-decision evidence). The archive report is saved as Engram observation for topic `sdd/web-push-notifications/archive-report`.
- Review artifacts: none exist (`reviews/` directory absent in the change folder; `reviewGate` structurally absent in native status) — none were read.

## Gate Notes

- **Native Review Receipt Gate**: `reviewGate` structurally absent (no review ever started for this candidate; no `reviews/` directory; no review artifacts). Archive proceeded under ordinary repository policy.
- **Task Completion Gate**: persisted `tasks.md` shows 26/26 `[x]`, 0 `[ ]`; Engram tasks mirror (obs 88) agrees. No stale unchecked implementation tasks for completed work exist in the audit trail. No exceptional reconciliation was needed.
- **CRITICAL gate**: `verify-report.md` has 0 CRITICAL findings (`critical_findings: 0`, `blockers: 0`, verdict `pass_with_warnings` natively admitted); no block.
- **Action context**: no `workspace-planning` mode reported; no `allowedEditRoots` restriction beyond the workspace. All archive operations stayed inside `openspec/` under the repo root. No source code modified by the archive phase (`backend/` and `costura-app/` untouched). Commit of the archive changes is handled per the orchestrator's instruction (conventional commit on `dev`).
