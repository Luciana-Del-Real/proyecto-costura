# Archive Report — ui-flat-redesign

## Change

- **Name**: `ui-flat-redesign`
- **Archived**: 2026-08-27 → `openspec/changes/archive/2026-08-27-ui-flat-redesign/`
- **Artifact store**: both (OpenSpec files + Engram). NOTE: Engram MCP tools were unavailable in this session (per apply-progress and the archive launch prompt) — the archive report is persisted as a FILE ONLY; no Engram observation was written, so no observation IDs are available for traceability. All artifacts were read from the filesystem.
- **Verdict at close**: PASS WITH WARNINGS — 0 CRITICAL, 0 blockers. `verify-report.md` was natively admitted by `gentle-ai sdd-verify-validate` (valid=true, verdict `pass_with_warnings`, `evidence_revision` sha256:66f415b2cd8e3ba60a687c534365204b7806b035c86ee807dc6da661385cdf86).

## Final State (at close)

The SDD cycle is complete. This report is the terminal record and reflects the state of the change AT CLOSE, not at earlier snapshot times. Authority: native review status > persisted tasks artifact > orchestrator final-state facts > intermediate snapshots (`apply-progress`/`verify-report`).

- **What shipped** (orchestrator final-state facts, outrank the intermediate snapshots): implementation landed on `dev` in 10 commits after `6dee503`:
  1. `e48375c` — PageHeader + public
  2. `4fa3a70` — Courses tagline fix
  3. `392dae5` — MyCourses
  4. `a700114` — Profile
  5. `e53bdf2` — Dashboard
  6. `1475abe` — Checkout
  7. `55a86d3` — admin headers
  8. `e646218` — AdminUsers + AdminRequests
  9. `8628182` — AdminCourseForm
  10. `bd7e643` — admin components
  - `dev` head at archive time: **`bd7e643`**. All 10 commits are LOCAL, not yet pushed (delivery handled by the orchestrator). The archive phase itself never commits.
- **Tasks**: **26/26 complete** (per the persisted `tasks.md`, which marks all 26 `[x]` — 8 PR1 + 8 PR2 + 10 PR3). The three owner manual-QA tasks (1.8 public, 2.8 student, 3.10 admin incl. mobile ≤640px) were COMPLETED by the owner on 2026-08-27 with "all OK" confirmation. See Task Reconciliation below.
- **Verification (per verify-report, natively admitted)**: PASS WITH WARNINGS — 5/5 requirements, 10/10 scenarios COMPLIANT. `npm test` in `costura-app/` → **13 files / 91 tests passed**; `npm run build` → **succeeds** (vite, 1844 modules); `npm run lint` → **clean**. No CRITICAL findings. Old banner class eliminated app-wide (0 occurrences); nesting-depth ≤1 verified by static audit.

## Task Reconciliation (1.8 / 2.8 / 3.10 — owner manual QA, RESOLVED at close)

`verify-report` (intermediate snapshot, verification time) reported 23/26 tasks complete with 1.8/2.8/3.10 pending owner browser QA and carried that as its sole WARNING. Per the Final-State Authority hierarchy, the snapshot's "pending" claim is only valid for the moment it was written: the persisted `tasks.md` (rank 2) and the orchestrator's final-state facts (rank 3) both record that the owner completed all three manual-QA tasks on 2026-08-27 with "all OK" confirmation — including mobile ≤640px on student and admin pages. The verify WARNING about pending owner QA is therefore **RESOLVED**; the archive is NOT marked intentional-with-warnings for task completion. No stale unchecked implementation tasks exist in the archived audit trail (0 `[ ]` in archived `tasks.md`).

## Specs Synced

| Domain | Action | Details |
|--------|--------|---------|
| design-system | Updated (merged into existing main spec) | 5 ADDED requirements appended verbatim (Nesting-depth ≤1 rule, Flat typographic page headers, Single-surface-per-view, PageHeader shared component, Affordances preserved) + 10 scenarios. 0 modified, 0 removed, 0 renamed. |

**Merge decision & evidence**: `openspec/specs/design-system/spec.md` already existed (promoted verbatim from the 2026-08-24 `design-system-overhaul` archive; `git diff --no-index` between the archived delta and the main spec = exit 0, byte-identical). The delta spec `openspec/changes/ui-flat-redesign/specs/design-system/spec.md` contains only an `## ADDED Requirements` section, so the merge was a pure append following the repo's established convention: append ADDED requirements verbatim, preserve all existing requirements, non-destructive. The 5 new requirement blocks were appended in place (byte-exact, UTF-8 no BOM, CRLF normalized to match the main spec). Evidence:

- `git diff --numstat -- openspec/specs/design-system/spec.md` → `36  1` (36 insertions; the single "deletion" is EOF-newline normalization of the pre-existing last line, whose content is unchanged).
- Appended block vs delta ADDED section: extracted from both files at the first `### Requirement: Nesting-depth ≤1 rule` marker — lengths equal (3062 == 3062), string comparison `IDENTICAL: True`, and verbatim `diff` readback: `DIFF_EXIT=0` with zero output lines.
- The full `git diff` shows only `+` lines for the 5 new requirement blocks; all 8 pre-existing requirements (Single semantic token layer … Button text policy) appear unchanged.

`openspec/config.yaml` `rules.archive` ("Warn before merging destructive deltas") was evaluated: the merge is additive-only (no REMOVED/MODIFIED/RENAMED blocks), so no destructive-merge warning was required.

## Archive Contents

- `proposal.md` ✅
- `exploration.md` ✅
- `specs/design-system/spec.md` ✅
- `design.md` ✅
- `tasks.md` ✅ (26/26 `[x]`; 0 unchecked)
- `apply-progress.md` ✅
- `verify-report.md` ✅
- `archive-report.md` ✅ (this file, additive-only)

The active changes directory no longer contains this change (only `archive/` remains).

## Risks / Warnings Carried Forward (non-blocking)

1. **Static-audit coverage caveat** — per `verify-report`, 7 of 10 spec scenarios are verified via static class-string audit (project convention for class-only refactors), not automated render tests. No automated per-page depth/single-surface assertions exist. Documentation only; not a blocker at close.
2. **SUGGESTION (future work, not blockers)** — `Profile.jsx` line 62 nests a second plain container inside the page root (`max-w-6xl mx-auto px-1 py-1`); `MyCourses.jsx`/`AdminUsers.jsx`/`AdminRequests.jsx` carry similar plain-wrapper nesting. Harmless (no box classes) but could be simplified. Consider an automated depth guard (render pages via `renderToStaticMarkup` and assert no box-in-box) for future class-string refactors.

## Deviations from Design (documented in apply-progress / verify-report — all cosmetic, content identical)

1. **Courses tagline restored** (commit `4fa3a70`): `subtitle="Encontrá el curso perfecto para vos"` — information identical pre/post.
2. **AdminUsers modal stat rows** use `justify-between` (label left, value right) — content identical (counts, totals, currency), presentation only.
3. **CourseAttachmentsSection uploaded-PDF rows flattened** to `py-2 border-b border-border last:border-0` divider rows — filename link + Eliminar action preserved; extension of design required for the ≤1 depth rule.
4. **Profile avatar left-aligned** flat `bg-primary-soft rounded-full` identity row — avatar + initial preserved, no box wrapper.

## Mechanical Integrity (diff -r readbacks)

All copies/moves performed with native shell binaries (Git-for-Windows `bash` + `cp -R`/`mv`/`diff -r`); byte-identity verified with `diff -r` per the Mechanical Copy Contract. Verbatim readback results:

- **Archive move** (pre-move recursive snapshot vs `openspec/changes/archive/2026-08-27-ui-flat-redesign/`): `git mv` failed as expected (folder untracked), fallback `mv` succeeded; source-gone check passed; `diff -r` output lines = 0 (empty, byte-identical) → `ARCHIVE_MOVE_OK` (script exit 0).
- **Spec merge appended block** vs delta ADDED section: `diff` exit 0, output lines = 0 (byte-identical modulo CRLF normalization) → `MERGE_APPEND_OK`.
- **Main spec non-destructive proof**: `git diff` on `openspec/specs/design-system/spec.md` shows only additions (36 insertions; 1 EOF-newline normalization) — all pre-existing requirements preserved byte-for-byte.

The `archive-report.md` file is additive-only and excluded from the comparison (it did not exist in the source snapshot). All readbacks were zero; no truncation or alteration occurred.

## Traceability

- Engram observation IDs: **none** — Engram MCP tools unavailable this session; all artifacts read from the filesystem. No Engram observation was written (file-only persistence).
- Artifacts read (filesystem): `proposal.md`, `exploration.md`, `design.md`, `tasks.md`, `specs/design-system/spec.md`, `apply-progress.md`, `verify-report.md`, plus `openspec/config.yaml`, `openspec/specs/design-system/spec.md`, and the prior `2026-08-27-component-modularization/archive-report.md` (convention reference).
- Review artifacts: none exist (`reviews/` directory absent in the change folder; `reviewGate` structurally absent in native status) — none were read.

## Gate Notes

- **Native Review Receipt Gate**: `reviewGate` structurally absent (kill switch off / no review ever started for this candidate; no `reviews/` directory; no review artifacts). Archive proceeded under ordinary repository policy.
- **Task Completion Gate**: persisted `tasks.md` shows 26/26 `[x]`, 0 `[ ]` — no stale unchecked implementation tasks for completed work exist in the audit trail. No exceptional stale-checkbox reconciliation was needed.
- **CRITICAL gate**: `verify-report.md` has 0 CRITICAL findings (`critical_findings: 0`, `blockers: 0`); no block.
- **Action context**: no `workspace-planning` mode reported; no `allowedEditRoots` restriction beyond the workspace. All archive operations stayed inside `openspec/` under the repo root. No source code modified by the archive phase (`backend/` and `costura-app/` untouched). Nothing committed (openspec/ working-tree changes remain uncommitted per repo convention; the archive phase itself never commits).