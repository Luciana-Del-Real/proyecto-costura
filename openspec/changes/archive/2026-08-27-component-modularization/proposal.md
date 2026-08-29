# Proposal: Component Modularization

## Intent
`costura-app/` still has modularization debt: ~120 lines of duplicated comment-thread JSX, 4 identical file-input blocks, a 305-line `ConsultasSection`, a notification inbox bolted onto `MyCourses`, and a deep 7-provider `App.jsx` gate. Behavior-preserving extraction cuts duplication and cognitive load — no visual unification.

## Scope

### In Scope
1. **`CommentThread.jsx`** — shared thread renderer + inline reply for `LessonCommentsSection` (student) & `ConsultasSection` (admin). Minimal surface; per-side labels/badges ("Vos"/"Profesora" vs "Alumna"/"Respondida") kept; chrome caller-side.
2. **`FilePicker.jsx`** — styled file input replacing 4 identical className blocks.
3. **`NotificationsInbox.jsx`** — extract notification panel from `MyCourses.jsx`; state via existing `useNotifications`.
4. **`App.jsx` `Providers`** — flatten the 7-provider gate; **preserve provider order exactly**.
5. **`useAdminComments.js`** — extract fetch + filters + answered/unanswered partitioning; `ConsultasSection` → ~150-line pure view via `CommentThread`.
6. **`AdminCourseForm.jsx` hygiene** — drop dead `editedLessons.description` fallback (L115) & no-op `setLessonPdfFiles([])` (L124).
7. **Tests** — Vitest for the 4 new units (follow `smoke.test.jsx` / `useLessonComments.test.jsx`).

### Out of Scope
`CourseCatalogContext` split; `AdminCourseForm`/`CourseDetail` decomposition; `AdminUsers`/`AdminSales` splits; visual comment-thread unification; `useLessonComments` (done).

## Capabilities
Pure behavior-preserving refactor; no user-facing behavior changes.
- **New**: None
- **Modified**: None

> Optionally: sdd-spec may add a structural "SHALL use `CommentThread`" requirement to `design-system` if dedup enforcement is wanted.

## Approach
Leaf-first: `FilePicker` → `CommentThread` → `useAdminComments` → `NotificationsInbox` → `Providers` → `AdminCourseForm` hygiene. Diff-verified per step; tests per unit.

## Affected Areas

| Area | Impact |
|---|---|
| `components/{CommentThread,FilePicker,NotificationsInbox}.jsx`, `hooks/useAdminComments.js` | New |
| `App.jsx` | Modified — `Providers` composition, order preserved |
| `course/LessonCommentsSection.jsx`, `admin/ConsultasSection.jsx`, `admin/{CourseAttachmentsSection,LessonEditorItem,NewLessonForm}.jsx` | Modified — render via `CommentThread` / use `FilePicker`; Consultas ~305→150L |
| `pages/MyCourses.jsx`, `pages/admin/AdminCourseForm.jsx`, `smoke.test.jsx`, `*.test.jsx` | Modified — inbox render; dead-state cleanup; coverage + import churn |

## Risks

| Risk | L | Mitigation |
|---|---|---|
| Thread divergence over-parameterizes shared component | Med | Minimal surface; labels caller-side; diff-verify both UIs |
| Provider-order regression in `App.jsx` | Low | Preserve exact nesting; review enforces |
| No `ConsultasSection`/`MyCourses` tests → visual regression | Med | Manual pass on admin consultas + student inbox; component tests cover units |
| `smoke.test.jsx` import churn | Low | Same-commit import update; no data-flow change |

## Rollback Plan
Behavior-preserving refactors; no migrations/schema changes. Rollback = `git revert` of the PR(s), restoring prior duplicated code. `AdminCourseForm` hygiene reverts independently.

## Dependencies
- `useNotifications` hook; `utils/commentTree.js groupCommentsByParent` (consumed as-is).

## Success Criteria
- [ ] `CommentThread` renders both UIs with original labels/badges; manual pass shows no visual change
- [ ] 4 file inputs use `FilePicker`; `ConsultasSection.jsx` ≤ ~150 lines, pure view
- [ ] `MyCourses.jsx` renders `<NotificationsInbox/>` with empty/loading/error intact
- [ ] `App.jsx` order unchanged; `AdminCourseForm` dead paths removed; Vitest for 4 new units; `npm test` + build green in `costura-app/`
