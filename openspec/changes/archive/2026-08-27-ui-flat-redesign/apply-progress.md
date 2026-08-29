# Apply Progress: ui-flat-redesign — PR1 (Public)

**Change**: ui-flat-redesign
**PR slice**: PR1 of 3 (public) — stacked-to-main chain
**Mode**: Standard (config `tdd: false`)
**Artifact store**: hybrid (openspec files + Engram); Engram MCP unavailable in this session — persisted as file only.
**Date**: 2026-08-27

## Completed Tasks (PR1)

- [x] 1.1 Create `components/PageHeader.jsx` with `title`, optional `subtitle`, `accent` (no box classes).
- [x] 1.2 Add `components/PageHeader.test.jsx`: title, subtitle, accent, empty-state render, no box class on root.
- [x] 1.3 Replace banner `bg-white rounded-2xl border-2 border-primary shadow-md px-4 py-10` in `pages/Courses.jsx` with `<PageHeader>` (title only).
- [x] 1.4 Replace banner in `pages/PatronesGratis.jsx`; keep pattern cards as surfaces.
- [x] 1.5 Replace banner in `pages/Favorites.jsx`; keep CourseCard surfaces.
- [x] 1.6 Update `components/smoke.test.jsx` imports/mocks if `PageHeader` affects renders. — **No change needed**: smoke tests render 8 extracted admin/course components; none import `PageHeader` or render the 3 public pages. Verified by test run.
- [x] 1.7 Verify: `npm test`, `npm run lint`, `npm run build` in costura-app. — All green (see below).
- [ ] 1.8 Manual QA public: headers, filters, empty states; audit class strings depth ≤1. — **Owner work, deferred.** Static-audit half completed in this batch (see Static Audit); browser QA remains for the owner.

## Files Changed

| File | Action | What Was Done |
|------|--------|---------------|
| `costura-app/src/components/PageHeader.jsx` | Created | Shared flat typographic header (h1 + optional subtitle + pink accent), no box classes, always renders. |
| `costura-app/src/components/PageHeader.test.jsx` | Created | 8 unit tests: title h1, subtitle present/absent, accent default/`false`, empty-state renders, no-props render, root has no box-surface class. |
| `costura-app/src/pages/Courses.jsx` | Modified | Banner box replaced with `<PageHeader title="Todos los cursos" />` (title only). Import added. |
| `costura-app/src/pages/PatronesGratis.jsx` | Modified | Banner box replaced with `<PageHeader>` (title + subtitle preserved). Pattern `card-glow` cards kept as surfaces. |
| `costura-app/src/pages/Favorites.jsx` | Modified | Banner box replaced with `<PageHeader>` (title + dynamic subtitle preserved). CourseCard surfaces kept. |

## Work Unit Evidence

| Evidence | Value |
|---|---|
| Focused test command and exact result | `npm test` in `costura-app/` → 13 files / 91 tests passed (incl. new `PageHeader.test.jsx`). Exit 0. |
| Runtime harness command/scenario and exact result | `N/A` — presentational class-only refactor with no runtime boundary exercised in this batch. Static render tests (`renderToStaticMarkup`) + production build prove render integrity; visual QA is task 1.8 (owner browser QA). |
| Rollback boundary | Revert commit `e48375c` or the 5 files: `components/PageHeader.jsx`, `components/PageHeader.test.jsx`, `pages/Courses.jsx`, `pages/PatronesGratis.jsx`, `pages/Favorites.jsx`. No PR2/PR3 file touched. |

## Verification Results (task 1.7)

- `npm test` → **13 test files, 91 tests passed** (exit 0)
- `npm run lint` → **clean** (exit 0)
- `npm run build` → **vite build succeeded** (exit 0; 1844 modules)

## Static Audit (part of task 1.8)

- Grep for `bg-white rounded-2xl border-2 border-primary shadow-md` across `costura-app/src`: **zero occurrences in the 3 public pages**. Remaining 7 occurrences are all PR2/PR3 files (MyCourses, Profile, AdminUsers, AdminCourses, AdminPatterns, AdminSales, AdminRequests) — untouched, out of PR1 scope.
- `PageHeader` root class = `max-w-6xl mx-auto px-1 pt-6 pb-2 animate-fade-up` — no `card*`, `bg-white`, border, shadow, or rounded classes (also enforced by unit test).
- `PageHeader` consumed by exactly Courses, PatronesGratis, Favorites.

## Deviations from Design

1. **Courses subtitle dropped (title only).** RESOLVED by owner decision (2026-08-27): tagline restored via commit `4fa3a70` `fix(ui): restore Courses tagline as PageHeader subtitle` — `<PageHeader title="Todos los cursos" subtitle="Encontrá el curso perfecto para vos" />`. Tests 16/16 green (PageHeader.test + smoke).

Otherwise: None — implementation matches design.

## Issues Found

- Pre-staged openspec renames from the prior archive phase (component-modularization artifacts) were initially swept into the first commit attempt; the commit was reset and redone to include only the 5 costura-app files. The openspec artifacts remain uncommitted/untracked as before.

## Deferred to PR2 / PR3

- PR2 (student): MyCourses, Profile, Dashboard, Checkout wrappers/headers + hotspots, NotificationsInbox preservation.
- PR3 (admin): AdminUsers, AdminCourses, AdminPatterns, AdminSales, AdminRequests, AdminCourseForm + admin components.
- Task 1.8 browser QA (owner): headers, filters, empty states on public pages.

## Commit

- `e48375c` — `feat(ui): extract shared PageHeader and flatten public page headers` (5 files, +71/−20). Local only; PR creation/push handled by orchestrator.
- `4fa3a70` — `fix(ui): restore Courses tagline as PageHeader subtitle` (1 file, +1/−1). Local only.

## Status

7/8 PR1 tasks complete (1.8 owner QA pending). Ready for PR2 apply batch.

---

# Apply Progress: ui-flat-redesign — PR2 (Student)

**Change**: ui-flat-redesign
**PR slice**: PR2 of 3 (student) — stacked-to-main chain
**Mode**: Standard (config `tdd: false`)
**Artifact store**: hybrid (openspec files + Engram); Engram MCP unavailable in this session — persisted as file only.
**Date**: 2026-08-27

## Completed Tasks (PR2)

- [x] 2.1 Replace banner in `pages/MyCourses.jsx`; remove page wrapper, keep rows + `NotificationsInbox` surface. — Banner box replaced with `<PageHeader title="Mis cursos" subtitle={count} />`; no page-wrapper card remains; course `card-glow` rows and `NotificationsInbox` (its own `card-glow`) untouched.
- [x] 2.2 Replace banner in `pages/Profile.jsx`; move avatar to flat `bg-primary-soft rounded-full` identity row. — Banner box replaced with `<PageHeader title={user.name} />`; avatar circle now sits in a flat flex row (`bg-primary-soft rounded-full`, no box wrapper).
- [x] 2.3 Remove `Dashboard.jsx` outer `card-glow`; keep course cards. — Outer `card-glow rounded-2xl max-w-6xl mx-auto px-4 py-4` wrapper removed; sections now direct children of the page container; CourseCard surfaces intact.
- [x] 2.4 `Checkout.jsx`: order-summary `card-glow` sole surface; transfer steps seam-separated, CVU/Alias rows `border-b`, warning tinted notice. — Order summary keeps `card-glow p-6 h-fit` (sole surface). Payment instructions column flattened (`p-6`, no card). Transfer steps: inner `card-glow rounded-xl p-4` removed; step 2 separated by `mt-6` whitespace. CVU/Alias/account rows now flat `py-3 border-b border-border last:border-0` (no `bg-white`, no `rounded-lg`, no nested card). Warning box: `card-soft rounded-xl shadow-sm` → tinted notice `bg-primary-soft/60 rounded-xl p-4` (bg tint only, no card chrome).
- [x] 2.5 `Profile.jsx` hotspots: saved toast → inline `text-primary text-sm px-0 py-2 mb-4`; purchase history flat divider section; personal card sole surface. — Saved toast `card-glow text-primary text-sm rounded-xl px-4 py-3 mb-4` → `text-primary text-sm px-0 py-2 mb-4` (no card). Purchase history wrapper `card-glow rounded-2xl px-4 py-10` → flat `px-1 py-10` section; its rows were already flat `py-3 border-b border-border last:border-0` and remain. Personal "Información personal" `card-glow` is now the only `card-glow` on the page (sole surface). Error notice and input borders (`border-border`/`rounded-xl`) unchanged.
- [x] 2.6 Preserve `NotificationsInbox.jsx` affordances (unchanged). — File not touched; its `rounded-xl border` notification rows remain affordances per spec.
- [x] 2.7 Verify: `npm test`, `npm run lint`, `npm run build` in costura-app. — All green (see below). Mobile ≤640px QA is owner work (deferred to 2.8 with 1.8-style split).
- [ ] 2.8 Manual QA: Dashboard/MyCourses/Notifications, Profile toast, Checkout payment/copy; depth ≤1 audit. — **Owner work, deferred.** Static-audit half completed in this batch (see PR2 Static Audit); browser QA remains for the owner.

## Files Changed

| File | Action | What Was Done |
|------|--------|---------------|
| `costura-app/src/pages/MyCourses.jsx` | Modified | Banner box → `<PageHeader title="Mis cursos" subtitle={count}>`; page-wrapper card removed. Course rows + NotificationsInbox surfaces kept. |
| `costura-app/src/pages/Profile.jsx` | Modified | Banner box → `<PageHeader title={user.name}>` + flat avatar identity row; saved toast → inline notice; purchase history card → flat divider section; personal card stays sole surface. |
| `costura-app/src/pages/Dashboard.jsx` | Modified | Outer `card-glow` wrapper removed; section headers/cards kept. |
| `costura-app/src/pages/Checkout.jsx` | Modified | Order-summary `card-glow` kept as sole surface; payment instructions/transfer steps flattened; CVU/Alias rows → flat `border-b`; warning → tinted notice. |

## Work Unit Evidence

| Evidence | Value |
|---|---|
| Focused test command and exact result | `npm test` in `costura-app/` → 13 files / 91 tests passed (unchanged count — no test touched; `Profile.test.jsx` asserts text only and still passes). Exit 0. Also re-run after commits: 13/91 green. |
| Runtime harness command/scenario and exact result | `N/A` — presentational class-only refactor with no runtime boundary exercised in this batch. Static render tests + production build prove render integrity; visual QA is task 2.8 (owner browser QA incl. ≤640px). |
| Rollback boundary | Revert commits `392dae5` (MyCourses), `a700114` (Profile), `e53bdf2` (Dashboard), `1475abe` (Checkout) — or the 4 files listed above. No PR1/PR3 file touched; `NotificationsInbox.jsx` and `index.css` untouched. |

## Verification Results (task 2.7)

- `npm test` → **13 test files, 91 tests passed** (exit 0) — run pre-commit and post-commit (identical result)
- `npm run lint` → **clean** (exit 0)
- `npm run build` → **vite build succeeded** (exit 0; 1844 modules)

## Static Audit (part of task 2.8)

- Grep for `bg-white rounded-2xl border-2 border-primary shadow-md` in `costura-app/src/pages`: **zero occurrences in the 4 PR2 student files**. Remaining 5 occurrences are all PR3 admin files (AdminCourses, AdminPatterns, AdminRequests, AdminSales, AdminUsers) — untouched, out of PR2 scope.
- `card-glow` inventory in PR2 files: MyCourses course rows (intended surfaces), Profile personal card (sole surface), Checkout order-summary + requested-screen card (one per view), Dashboard **zero** (wrapper removed; cards render via `CourseCard`). Depth ≤1 by class inspection on all 4 pages.
- `NotificationsInbox.jsx`: unchanged (task 2.6).

## Deviations from Design

None — implementation matches design.md exactly (PageHeader contract, surface ownership, hotspot class strings per design).

## Issues Found

None.

## Deferred to PR3 / Owner

- PR3 (admin): AdminUsers, AdminCourses, AdminPatterns, AdminSales, AdminRequests, AdminCourseForm + admin components (tasks 3.1–3.10).
- Task 2.8 browser QA (owner): Dashboard/MyCourses/Notifications, Profile toast, Checkout payment/copy, mobile ≤640px.

## Commits

- `392dae5` — `feat(ui): flatten MyCourses header with PageHeader and drop page wrapper` (1 file, +5/−6)
- `a700114` — `feat(ui): flatten Profile identity, saved toast, and purchase history` (1 file, +9/−10)
- `e53bdf2` — `feat(ui): remove Dashboard outer card-glow wrapper` (1 file, +28/−30)
- `1475abe` — `feat(ui): flatten Checkout payment instructions and transfer rows` (1 file, +7/−7)

Local only; PR creation/push handled by orchestrator. Stacked on `4fa3a70` (PR1 head).

## Status

7/8 PR2 tasks complete (2.8 owner QA pending). Ready for PR3 apply batch.

---

# Apply Progress: ui-flat-redesign — PR3 (Admin)

**Change**: ui-flat-redesign
**PR slice**: PR3 of 3 (admin) — stacked-to-main chain
**Mode**: Standard (config `tdd: false`)
**Artifact store**: hybrid (openspec files + Engram); Engram MCP unavailable in this session — persisted as file only.
**Date**: 2026-08-27

## Completed Tasks (PR3)

- [x] 3.1 `AdminUsers.jsx`: banner box → `<PageHeader title="Alumnos" subtitle={dynamic count} />`. Modal shell stays the one `card-glow`; the two inner `card-glow rounded-xl` stat cards → flat bordered stat rows: `divide-y divide-border border-y border-border` group, each row `py-3 flex items-center justify-between` (label left, value right). Avatars, chips, progress bars, modal controls unchanged.
- [x] 3.2 `AdminCourses.jsx` + `AdminPatterns.jsx`: banner box → `<PageHeader>` inside a non-box flex row (`flex items-start justify-between gap-4 flex-wrap mb-4`, header wrapped in a plain `min-w-0` div to neutralize `PageHeader`'s `mx-auto` inside flex; action `Link` stays a flat `btn` with `mt-6` aligned to the title). Course/pattern rows and cover boxes (`bg-bg-soft rounded-lg` — tinted image placeholder, no border/shadow, affordance-like) kept as surfaces.
- [x] 3.3 `AdminSales.jsx`: banner → `<PageHeader title="Historial de ventas" />`; summary cards + bar-chart card + table wrapper remain the page surfaces (all siblings — no >1 nesting). `AdminRequests.jsx`: banner → `<PageHeader title="Panel de Solicitudes" subtitle="…" />`; one list `card-glow` kept; per-request rows `card-glow rounded-xl` → flat `p-3 border-b border-border last:border-0`.
- [x] 3.4 `AdminCourseForm.jsx`: two `card-glow p-8` panels merged into ONE `card-glow rounded-2xl p-8` containing both form sections, separated by `<div className="seam-divider my-10" aria-hidden="true" />` (matches Home's seam-divider usage; class = 3px stitched fuchsia divider). `mb-8` on the panel dropped (no second panel below). Lessons section renders inside a fragment when `isEditing`.
- [x] 3.5 `LessonEditorItem.jsx`: root `card-glow p-4 rounded-xl` → flat `p-4 space-y-3`; PDF upload box `p-3 bg-white rounded-xl border border-border` → flat labeled area (no box); uploaded-PDF rows `bg-white border border-border rounded-lg px-3 py-2` → flat divider rows `py-2 border-b border-border last:border-0`. Input borders (`border border-border rounded-lg`) preserved.
- [x] 3.6 `NewLessonForm.jsx`: form `card-glow p-4 rounded-xl space-y-3 border-2 border-dashed border-primary/40` → flat `p-4 space-y-3`; all controls + spacing kept.
- [x] 3.7 `CourseAttachmentsSection.jsx`: both upload boxes `bg-white border border-border rounded-xl p-4` → flat (`md:col-span-2` kept on the portada wrapper for grid placement; second box plain `div`); uploaded-PDF rows `bg-white rounded-lg px-3 py-2 border border-border` → flat divider rows `py-2 border-b border-border last:border-0`. Labels/pickers flat. (Slight extension of design: design said remove both upload boxes; the uploaded-row boxes were also `bg-white …border` nested boxes inside the course form surface, so they were flattened to divider rows too — required for the ≤1 depth rule, same pattern as 3.5.)
- [x] 3.8 `index.css` mobile `section + section` ≤640px rule (L537): **verified, NO change needed.** Grep confirms zero `<section>` elements in `pages/admin` + `components/admin` (all `div`s; `PageHeader` renders a `<header>`). The rule only affects Home's stacked `<section>`s and does not interact with any flattened admin section. Documented per design decision "Keep mobile `section + section` rule unchanged".
- [x] 3.9 Verify: `npm test` → **13 test files, 91 tests passed** (exit 0, pre- and post-commit identical); `npm run lint` → **clean** (exit 0); `npm run build` → **vite build succeeded** (exit 0; 1844 modules). Mobile ≤640px browser QA deferred to 3.10 (owner).
- [ ] 3.10 Manual QA: admin headers/actions, tables/rows, modal stats, form uploads/lesson CRUD; depth ≤1 audit. — **Owner work, deferred.** Static-audit half completed in this batch (see PR3 Static Audit); browser QA remains for the owner.

## Files Changed

| File | Action | What Was Done |
|------|--------|---------------|
| `costura-app/src/pages/admin/AdminUsers.jsx` | Modified | Banner → `<PageHeader title="Alumnos">`; modal stat cards → flat `divide-y`/bordered rows; modal shell + table wrapper remain the surfaces. |
| `costura-app/src/pages/admin/AdminCourses.jsx` | Modified | Banner → `<PageHeader title="Gestión de cursos">` + flat "Nuevo curso" `Link` (flex row, non-box wrapper). Rows/cover boxes kept. |
| `costura-app/src/pages/admin/AdminPatterns.jsx` | Modified | Banner → `<PageHeader title="Gestión de patrones">` + flat "＋ Nuevo patrón" `Link` (flex row, non-box wrapper). Rows/cover boxes kept. |
| `costura-app/src/pages/admin/AdminSales.jsx` | Modified | Banner → `<PageHeader title="Historial de ventas">`. Summary cards/chart/table wrapper kept (siblings). |
| `costura-app/src/pages/admin/AdminRequests.jsx` | Modified | Banner → `<PageHeader title="Panel de Solicitudes">`; request rows → flat `p-3 border-b border-border last:border-0`; one list `card-glow` kept. |
| `costura-app/src/pages/admin/AdminCourseForm.jsx` | Modified | Two `card-glow p-8` panels merged into one; sections separated by `seam-divider my-10`; lessons section wrapped in fragment. |
| `costura-app/src/components/admin/LessonEditorItem.jsx` | Modified | Flat lesson section; PDF box flattened; attachment rows → divider rows; input borders kept. |
| `costura-app/src/components/admin/NewLessonForm.jsx` | Modified | Dropped `card-glow`/dashed surface; controls + spacing kept. |
| `costura-app/src/components/admin/CourseAttachmentsSection.jsx` | Modified | Both `bg-white rounded-xl` upload boxes removed; labels/pickers flat; uploaded rows → divider rows. |
| `costura-app/src/index.css` | Unchanged | Task 3.8 verified — mobile `section + section` rule unaffected (no `<section>` in admin files); no change needed. |

## Work Unit Evidence

| Evidence | Value |
|---|---|
| Focused test command and exact result | `npm test` in `costura-app/` → 13 files / 91 tests passed (exit 0). Run twice: pre-commit (after all edits) and post-commit (after 4 commits) — identical result. No test file touched (class-only refactor; smoke.test.jsx renders `LessonEditorItem`/`NewLessonForm`/`CourseAttachmentsSection` and asserts text only, still green). |
| Runtime harness command/scenario and exact result | `N/A` — presentational class-only refactor with no runtime boundary exercised in this batch. Static render tests + production build prove render integrity; visual QA incl. mobile ≤640px is task 3.10 (owner browser QA). |
| Rollback boundary | Revert commits `bd7e643`, `8628182`, `e646218`, `55a86d3` (or the 9 files above). No PR1/PR2 file touched; `index.css`, `NotificationsInbox.jsx`, `AdminDashboard.jsx`, `AdminPatternForm.jsx` untouched. |

## Verification Results (task 3.9)

- `npm test` → **13 test files, 91 tests passed** (exit 0) — run pre-commit and post-commit (identical result)
- `npm run lint` → **clean** (exit 0)
- `npm run build` → **vite build succeeded** (exit 0; 1844 modules)

## Static Audit (part of task 3.10)

- Grep for `bg-white rounded-2xl border-2 border-primary shadow-md` across `costura-app/src`: **ZERO occurrences app-wide** — the old banner class is fully removed from the app (was only in the 5 PR3 admin files after PR1/PR2).
- `<section` in `pages/admin` + `components/admin`: **zero** → task 3.8 verified (mobile `section + section` rule unaffected).
- `card-glow` inventory per PR3 page (depth ≤1 by class inspection):
  - `AdminUsers`: 1 table wrapper + 2 modal shells (detail + confirm modals — mutually exclusive fixed overlays, never nested) → 0 inner cards (stats now flat rows). Depth ≤1.
  - `AdminCourses`: 1 per course row (surface). `AdminPatterns`: 1 per row + 1 empty-state surface. `AdminSales`: 2 summary cards + 1 chart card + 1 table wrapper (all siblings). `AdminRequests`: 1 list surface (rows flat). `AdminCourseForm`: exactly 1 (merged panel). Depth ≤1 everywhere; no `card-glow` inside another `card-glow`.
- `components/admin`: `LessonEditorItem`, `NewLessonForm`, `CourseAttachmentsSection` now have **zero** `card-glow`/`bg-white …border` boxes. Only out-of-scope `ConsultasSection` (its own `card-glow` inbox) retains a surface.

## Deviations from Design

1. **`CourseAttachmentsSection` uploaded-PDF rows also flattened** (design said "remove both `bg-white …rounded-xl` upload boxes"): the existing-upload rows were `bg-white rounded-lg px-3 py-2 border border-border` boxes nested inside the course form surface, so they were converted to flat divider rows (`py-2 border-b border-border last:border-0`) — required for the spec's ≤1 depth rule and consistent with 3.5's attachment rows.
2. **`AdminUsers` modal stat row layout**: label left, value right (`justify-between`) instead of the old centered value-over-label — content identical, flat row presentation per design's "bordered stat rows".

Otherwise: None — implementation matches design.md (PageHeader contract, surface ownership, hotspot class strings).

## Issues Found

- `rg` (ripgrep) is not installed on this Windows host — static audits used the built-in grep tool instead; results identical.

## Deferred to Owner

- Task 3.10 browser QA: admin headers/actions, tables/rows, modal stats, form uploads/lesson CRUD, mobile ≤640px.

## Commits

- `55a86d3` — `feat(ui): replace admin page header banners with PageHeader` (3 files: AdminCourses, AdminPatterns, AdminSales; +15/−14)
- `e646218` — `feat(ui): flatten admin users and requests nesting with PageHeader` (2 files: AdminUsers, AdminRequests; +13/−18)
- `8628182` — `feat(ui): merge AdminCourseForm panels into a single surface` (1 file; +38/−37)
- `bd7e643` — `feat(ui): flatten admin lesson and attachment form components` (3 files: LessonEditorItem, NewLessonForm, CourseAttachmentsSection; +10/−10)

Local only; PR creation/push handled by orchestrator. Stacked on `1475abe` (PR2 head).

## Status

9/10 PR3 tasks complete (3.10 owner QA pending). **All three slices implemented** — ready for verify phase (tasks 1.8/2.8/3.10 owner browser QA remain open).
## FINAL-STATE FACT (orchestrator, 2026-08-27)
- Owner completed ALL manual QA tasks (1.8 public, 2.8 student, 3.10 admin incl. mobile <=640px): ALL OK confirmed by owner.
- Tasks now 26/26 complete. Verify-report WARNING (owner QA open) is RESOLVED.
- All 10 commits local on dev (head bd7e643), not yet pushed (delivery handled by orchestrator).
