# Archive Report — component-modularization

## Change

- **Name**: `component-modularization`
- **Archived**: 2026-08-27 → `openspec/changes/archive/2026-08-27-component-modularization/`
- **Artifact store**: both (OpenSpec files + Engram). NOTE: Engram MCP tools were unavailable in this session (per apply-progress and the archive launch prompt) — the archive report is persisted as a FILE ONLY; no Engram observation was written, so no observation IDs are available for traceability. All artifacts were read from the filesystem.
- **Verdict at close**: PASS WITH WARNINGS — 0 CRITICAL, 0 blockers (per `verify-report.md`, natively admitted by `gentle-ai sdd-verify-validate`: valid=true, verdict `pass_with_warnings`, `evidence_revision` sha256:412fb862b364e0a805a5f75f208d332999c83ec5d0327e8e14444a0aff237dfb).

## Final State (at close)

The SDD cycle is complete. This report is the terminal record and reflects the state of the change AT CLOSE, not at earlier snapshot times. Authority: native review status > persisted tasks artifact > orchestrator final-state facts > intermediate snapshots (`apply-progress`/`verify-report`).

- **What shipped** (orchestrator final-state facts, outrank the intermediate snapshots): implementation merged onto `dev` in 7 commits after `43c1652`:
  1. `8f5d220` — FilePicker
  2. `da95901` — CommentThread
  3. `6f010bc` — useAdminComments + ConsultasSection pure view (148 lines)
  4. `209fa1f` — NotificationsInbox
  5. `c6f4d2a` — Providers + App flatten
  6. `0462aac` — AdminCourseForm hygiene
  7. `6dee503` — lint fix + apply-progress
  - `dev` head at archive time: **`6dee503`**.
- **Tasks**: **20/21 complete.** Task **7.3** (owner manual visual pass) is OWNER work — intentionally not performed by agents and intentionally NOT done; the archived `tasks.md` keeps it unchecked `[ ]` as the single incomplete task. See Task Reconciliation below.
- **Verification (per verify-report, native final-verify settlement)**: PASS WITH WARNINGS — 7/7 requirements, 8/8 scenarios COMPLIANT. `npm test` in `costura-app/` → **12 files / 83 tests pass**; `npm run build` → **succeeds** (vite 8.0.3, 1843 modules); `npm run lint` → **clean** (0 errors, 0 warnings). No CRITICAL findings.

## Task Reconciliation (7.3 — owner work, intentional-with-warnings)

`apply-progress` (intermediate snapshot) and the persisted `tasks.md` agree: 20/21 tasks are `[x]`; task 7.3 is unchecked. Task 7.3 is NOT a stale checkbox of completed work — it is a genuinely incomplete, OWNER-owned manual visual pass that was deliberately excluded from automated apply/verify. Per the sdd-archive contract and the orchestrator's explicit instruction, this is recorded as an intentional partial archive and the archive is marked **intentional-with-warnings**.

Exact scope of 7.3 (from apply-progress Follow-up): student/admin comment threads (labels, badges, reply forms, images), admin consultas filters + toggle, notifications inbox states (loading/error/empty/list, mark-read/mark-all/delete), course editor file inputs, app boot with the new Providers nesting. It remains open for the owner after archive.

## Specs Synced

| Domain | Action | Details |
|--------|--------|---------|
| component-modularization | Created (new main spec) | No `openspec/specs/component-modularization/spec.md` existed before this change. The delta spec is a FULL spec (not a delta): 7 requirements, 8 scenarios. Promoted mechanically (shell `Copy-Item` → `git diff --no-index` byte-identity → `Move-Item`). |

**Promotion decision & evidence**: The repo convention (verified against `openspec/specs/` and prior archive reports) is to promote every change's spec domain to `openspec/specs/` as a new main spec when none exists — including structural/refactor/hygiene domains: `design-system` (2026-08-24) and `code-quality-hygiene` (2026-08-24) are both refactor/hygiene domains and were promoted. `component-modularization` is a structural-refactor spec but MATCHES this established convention, so it was PROMOTED to `openspec/specs/component-modularization/spec.md`. No main spec existed, so the copy was non-destructive and config `rules.archive` ("Warn before merging destructive deltas") was not triggered.

## Archive Contents

- `proposal.md` ✅
- `exploration.md` ✅
- `specs/component-modularization/spec.md` ✅
- `design.md` ✅
- `tasks.md` ✅ (20/21 `[x]`; 1 documented owner-deferred entry: 7.3)
- `verify-report.md` ✅
- `archive-report.md` ✅ (this file, additive-only)

The active changes directory no longer contains this change (only `archive/` remains).

## Risks / Warnings Carried Forward (non-blocking)

Per `verify-report` WARNINGs, corroborated by apply-progress deviations and the orchestrator's final-state facts (no higher-ranked source supersedes them):

1. **`setLessonPdfFiles([])` reset removed (task 6.1, per design mandate)** — after a successful lesson save, `lessonPdfFiles[lesson.id]` retains the just-uploaded files, so a second save of the same lesson without picking new PDFs would re-upload the same files (duplicates). Implemented exactly as specified; flagged for the owner visual pass (7.3) — reinstate the reset if duplicates are observed.
2. **CommentThread unified row layout (cosmetic drift)** — author label uppercase, badge in header, date in header-right slot vs. the previous distinct admin question-card style. Labels, badges, reply behavior, and gating preserved per spec scenarios; cosmetic only, flagged for 7.3.
3. **Admin reply form single-toggle dismissal** — the separate in-form "Cancelar" button was replaced by the single "Responder"/"Cancelar" toggle below each row. Behavior (dismiss reply) preserved.
4. **Task 7.3 pending** — owner manual visual pass (see Task Reconciliation).

## Deviations from Design (documented in apply-progress)

1. Test infrastructure added: `@testing-library/react` + `@testing-library/dom` devDeps, `vitest.config.js` `globals: true`, per-file `// @vitest-environment jsdom` (enables the interaction tests for tasks 1.2/2.2/3.2/4.2).
2. FilePicker does not render `lang="es"` (only the cover input had it; preserving the 3 PDF inputs exactly; native dialog locale is browser-controlled).
3. Unified row layout in CommentThread (see WARNING 2).
4. Admin reply form single-toggle dismissal (see WARNING 3).

## Mechanical Integrity (diff -r readbacks)

All copies/moves performed with native shell binaries on PowerShell (`Copy-Item`/`Move-Item`/`git mv`); byte-identity verified with `git diff --no-index`, the reliable Windows equivalent of `diff -r` (same convention as prior archives). Verbatim readback results:

- **Spec promotion** (`openspec/changes/component-modularization/specs/component-modularization/spec.md` → `openspec/specs/component-modularization/spec.md`): `DIFF_STATUS=0`, diff output lines = 0 (empty, byte-identical) → `PROMOTED_OK`.
- **Archive move** (pre-move recursive snapshot vs `openspec/changes/archive/2026-08-27-component-modularization/`): `MOVED_VIA=git mv`, `SOURCE_GONE_OK`, `READBACK_STATUS=0`, diff output lines = 0 (empty, byte-identical) → `ARCHIVE_MOVE_OK`.

The `archive-report.md` file is additive-only and excluded from the comparison (it did not exist in the source snapshot). All readbacks were zero; no truncation or alteration occurred.

## Traceability

- Engram observation IDs: **none** — Engram MCP tools unavailable this session; all artifacts read from the filesystem. No Engram observation was written (file-only persistence).
- Review artifacts: none exist (`reviews/` directory absent in the change folder; `reviewGate` structurally absent in native status) — none were read.

## Post-Archive Addendum (2026-08-27, owner confirmation)

- **WARNING 1 RESOLVED**: the owner manually tested the lesson editor re-save flow (save lesson with PDF → save again without picking new PDFs) and confirmed **no duplicate PDFs are uploaded** — the `setLessonPdfFiles([])` reset removal (task 6.1) is verified correct in practice; no reinstate needed.
- Remaining owner checks from 7.3 (comment thread labels/badges/reply forms/images, admin consultas filters + toggle, inbox states, app boot) were visually confirmed working in the running local app (`dev` head `6dee503`, Vite on :5173).

## Gate Notes

- **Native Review Receipt Gate**: `reviewGate` structurally absent (no review ever started for this candidate; no `reviews/` directory; no review artifacts). Archive proceeded under ordinary repository policy.
- **Task Completion Gate**: persisted `tasks.md` shows 20/21 `[x]`; the single unchecked entry (7.3) is explicitly documented OWNER work, and the orchestrator explicitly directed that it be recorded as the single incomplete task with its exact scope. Archive is **intentional-with-warnings** for this entry. No stale unchecked implementation tasks for completed work exist in the audit trail.
- **CRITICAL gate**: `verify-report.md` has 0 CRITICAL findings (`critical_findings: 0`, `blockers: 0`); no block.
- **Action context**: no `workspace-planning` mode reported; no `allowedEditRoots` restriction beyond the workspace. All archive operations stayed inside `openspec/` under the repo root. No source code modified by the archive phase (`backend/` and `costura-app/` untouched). Nothing committed (openspec/ working-tree changes remain uncommitted per repo convention; the archive phase itself never commits).
