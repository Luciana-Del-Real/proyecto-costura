# Archive Report — design-system-overhaul

## Change

- **Name**: `design-system-overhaul`
- **Archived**: 2026-08-24 → `openspec/changes/archive/2026-08-24-design-system-overhaul/`
- **Artifact store**: hybrid (OpenSpec files + Engram)
- **Verdict at close**: PASS WITH WARNINGS — 0 CRITICAL, 0 blockers (per `verify-report.md` and Engram observation #39)

## Final State (at close)

The SDD cycle is complete. This report is the terminal record and reflects the state of the change AT CLOSE, not at earlier snapshot times.

- **What shipped**: 5 chained PRs, all merged into `dev` — design-tokens (#6), button-system (#7), global-reset-public (#8), global-reset-admin (#9), hex-sweep + Stage B (#10). `dev` head at close: **5226473**. All CSS/JSX only; backend/DB untouched.
- **Tasks**: 19/19 substantive tasks complete. Archived `tasks.md` shows 3.3/5.1/5.2/5.3 checked `[x]` with PR5 evidence; 1.3/1.4 remain unchecked but are explicitly documented as orchestrator-deferred (see Task Reconciliation below).
- **Verification (per verify-report #39 / `openspec/changes/design-system-overhaul/verify-report.md`)**: PASS WITH WARNINGS — 10/10 requirements, 23/23 scenarios compliant; `npm run build` exit 0 (7.49s); lint at the pre-existing 22-problem baseline (20 errors + 2 warnings, zero new; scoped eslint excluding baseline files exits 0); zero `[#` hexes in `src/`; zero v3 `!`-prefix; zero dead legacy helpers; canonical `.btn` system; Stage B Warm Editorial on public surfaces; admin parity.
- **Human manual route pass**: COMPLETED by the owner after the PR5 merge (confirmed this session).
- **Post-verify work completed after verify-report was persisted** (final-state facts, outrank the intermediate snapshot): task markers 3.3/5.1/5.2/5.3 synced to `[x]` during archive with PR5 evidence notes; deferral notes added to 1.3/1.4; human manual route pass confirmed complete.

## Specs Synced

| Domain | Action | Details |
|--------|--------|---------|
| design-system | Created (new main spec) | No `openspec/specs/design-system/spec.md` existed before this change; the delta spec was a full spec (8 requirements, 23 scenarios) and was promoted mechanically (shell `cp` → `git diff --no-index` byte-identity → `mv`). |

No destructive merge was performed (no main spec to merge into), so no merge warning was required (config `rules.archive`: "Warn before merging destructive deltas" — not triggered).

## Task Reconciliation (archive-time, orchestrator-instructed)

`verify-report` explicitly recorded that 3.3/5.1/5.2/5.3 shipped in merged PR5 code but their `[x]` markers were never synced in the committed tasks.md (reporting gap, not substantive gap). The orchestrator explicitly instructed archive-time reconciliation, backed by apply-progress/verify-report proof, per the Task Completion Gate exceptional-repair path:

- **3.3, 5.1, 5.2, 5.3 → `[x]`** — evidence notes added (Stage B public editorial + token sweep landed in PR5 commits 2c9a890/51615f2/0234c1b; grep `[#` over src/ = 0; v3 `!`-prefix = 0; lint baseline-identical; build exit 0).
- **1.3, 1.4 → left `[ ]` but documented** — orchestrator-deferred at apply time; their substance (hex-map/dead-helper/`!important` removal, parity/font verification) was delivered across PR3–PR5 and re-verified on merged dev 5226473. Not silently checked; each line carries an explicit ORCHESTRATOR-DEFERRED note. This is the documented partial representation the orchestrator requested; the archive is therefore **intentional-with-warnings** for these two entries.
- **Non-blocking dependency NOTE → left as a tracking note** — it is not an implementation task of this change; it tracks the separate future bugfix change. NOT absorbed here; carried forward in Out-of-Scope Follow-ups below.

## Archive Contents

- `proposal.md` ✅
- `exploration.md` ✅
- `specs/design-system/spec.md` ✅
- `design.md` ✅
- `tasks.md` ✅ (19/19 substantive tasks complete; 2 documented deferred entries + 1 external tracker note)
- `verify-report.md` ✅
- `archive-report.md` ✅ (this file, additive-only)

## Risks / Deviations Carried Forward (non-blocking)

Per `verify-report` WARNINGs (intermediate snapshot, still valid at close — no higher-ranked source supersedes them):

1. **Pre-existing lint baseline** — raw `npm run lint` exits 1 on 22 pre-existing problems (20 errors + 2 warnings in 12 files, all present before this change at eeb1252). Zero new lint problems introduced (scoped eslint on non-baseline files exits 0). A separate hygiene change owns the baseline.
2. **Admin stat-chip micro-shifts** — `#A85E42→terracotta`, `#A36700→ochre`, row-hover `#F2EDE7→black/5` documented parity-vs-token-lean deviations (intentional).
3. **Interactive list-rows without `.btn`** — Navbar notification rows and CourseDetail lesson-header accordions are styled list-rows; documented exception class to the explicit-only button rule.
4. **No visual test harness** — `npm run build` catches syntax/util-generation, not visual intent; manual passes are the visual gate (owner-completed post-PR5).

## Out-of-Scope Follow-ups (NOT absorbed here)

### Separate bugfix change (non-blocking dependency of this change)

level-badge enum mismatch, `localhost:3000` hardcodes, dead reset-password flow, profile persist, backend lint config, dead CORS wiring, etc. — tracked for a SEPARATE future SDD change; this change shipped without them by design.

### Archive/hygiene follow-ups from prior sessions

- `openspec/config.yaml` stale (`verify.test_command: ""`, context still says "no test runner installed") — update to real commands.
- Root `README.md` is UTF-16-LE encoded (git treats as binary) and missing `MAIL_ENABLED` row — convert + add.
- `backend/scripts/create-admin.js` driven by `.env` as much as by explicit args — operator awareness note.
- costura-app build emits pre-existing dashjs > 500 kB chunk-size warning — consider code-splitting.
- Frontend lint baseline (20 errors + 2 warnings) cleanup.
- Dependency audit: axios, sharp, lucide-react, cors — evaluate whether still needed ("deps podables").
- Unused `.ttf` font files ("ttf sin uso").
- `AdminContext.deleteUser` — review/cleanup.
- Dead helpers in `api.js` ("api.js helpers muertos").
- Modularization candidates: `AdminCourseForm`, `CourseDetail`, `useLessonComments`, `CourseCatalogContext` split, `MyCourses`, `App` providers gate.
- Unified dark-green hover token ("verde hover unificado") — one hover token instead of variants.
- `useInView` fix.

## Mechanical Integrity (diff -r readbacks)

All copies/moves performed with native shell binaries (`Copy-Item`/`Move-Item` on PowerShell; byte-identity verified with `git diff --no-index`, which is the reliable Windows equivalent of `diff -r`). Verbatim readback results:

- **Spec promotion** (`openspec/changes/design-system-overhaul/specs/design-system/spec.md` → `openspec/specs/design-system/spec.md`): `DIFF_STATUS=0` (byte-identical, empty diff) → `MOVED_OK`.
- **Archive move** (pre-move recursive snapshot vs `openspec/changes/archive/2026-08-24-design-system-overhaul/`): `READBACK_STATUS=0` (byte-identical, empty diff; only benign git CRLF notices) → `ARCHIVE_MOVE_OK`. Source directory confirmed gone; active changes directory no longer contains this change.

The `archive-report.md` file is additive-only and excluded from the comparison (it did not exist in the source snapshot). Any non-zero status would have failed the phase; both readbacks were zero.

## Traceability (Engram observation IDs read)

- `#28` — `sdd/design-system-overhaul/explore` (full content)
- `#31` — `sdd/design-system-overhaul/proposal` (full content)
- `#33` — `sdd/design-system-overhaul/spec` (full content)
- `#35` — `sdd/design-system-overhaul/design` (full content)
- `#37` — `sdd/design-system-overhaul/tasks` (full content)
- `#39` — verify-report content (title "SDD design-system-overhaul verify-report"; Engram topic metadata reads `sdd/design-system-overhaul/apply-progress` — noted anomaly: the verify-phase summary was upserted under the apply-progress topic key; no separate apply-progress observation exists in Engram. Content read is the verify report.)

No review artifacts exist (`reviews/` directory absent; `reviewGate` structurally absent in native status), so none were read.

## Gate Notes

- **Native Review Receipt Gate**: `reviewGate` structurally absent (no `reviews/` in the change folder; zero review artifacts in native status; no review ever started for this candidate). Archive proceeded under ordinary repository policy.
- **Task Completion Gate**: orchestrator explicitly instructed archive-time reconciliation; apply-progress/verify-report prove 19/19 substantive tasks complete. Reconciliation reason recorded above; archive is intentional-with-warnings for the two documented deferred entries.
- **CRITICAL gate**: `verify-report.md` has 0 CRITICAL findings; no block.
- **Action context**: `actionContext.mode: repo-local`; `allowedEditRoots: [Proyecto-Kiro]`; all archive operations stayed inside the workspace root. No source code modified by the archive phase. Nothing committed (openspec/ changes remain uncommitted per repo convention; a human or later commit handles them). DB untouched.