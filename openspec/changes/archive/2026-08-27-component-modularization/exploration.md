# Exploration — component-modularization

## Context

This exploration was launched to investigate frontend modularization candidates listed as follow-up debt in prior SDD archive reports (`openspec/changes/archive/2026-08-24-design-system-overhaul/archive-report.md` line 72 and `2026-08-24-functional-bugfixes/archive-report.md` line 92). The candidate list predates the `refactor/frontend-page-split` PRs (merged into `dev`, commits `b217b0b` "refactor(admin): extract course form sections into components", `c530182` "refactor(course): extract public hero, progress and lesson accordion components", `32a4af0` "refactor(hooks): add useLessonComments"). Several listed candidates are therefore **already implemented**. This exploration re-verifies each candidate against current `dev` code and scopes the remaining, genuine modularization work.

Stack (per `openspec/config.yaml`): React 19 + Vite + Tailwind 4, JSX (not TSX), Context API for global state, `services/api.js` fetch helpers, Vitest for tests. All line counts verified by counting actual file contents (see per-candidate tables).

## Current structure per candidate

### 1. `AdminCourseForm` — `costura-app/src/pages/admin/AdminCourseForm.jsx` (251 lines)

Already modularized. It delegates to four extracted presentational components and keeps orchestration (data loading, form state, CRUD handlers):

| Component | Lines | Responsibility |
|---|---|---|
| `AdminCourseForm.jsx` | 251 | Orchestration: load course (`GET /courses/:id`), save/create (`addCourse`/`updateCourse` from `useCourseCatalog`), lesson CRUD via `postForm`/`putForm`/`del` on `services/api`, per-lesson edit-state maps, attachment deletes |
| `components/admin/CourseFieldsForm.jsx` | 43 | Title/description/prices/level form fields + submit button |
| `components/admin/CourseAttachmentsSection.jsx` | 47 | Cover image + course PDFs (new files and already-uploaded list) |
| `components/admin/LessonEditorItem.jsx` | 75 | Edit existing lesson row (title/description/duration/videoUrl, PDFs, save/delete) |
| `components/admin/NewLessonForm.jsx` | 52 | New-lesson draft form |

All four children are covered by `src/components/smoke.test.jsx` (render-to-static-markup mount tests). The page itself has no direct test — its orchestration (8 async handlers, 12 state slices) is the part that remains untested. The old 476-line monolith (documented in `2026-08-21-code-quality-refactor/exploration.md` item 18) is gone.

### 2. `CourseDetail` — `costura-app/src/pages/CourseDetail.jsx` (280 lines)

Already decomposed. The page is a thin router-thunk with three view branches plus an owned-course view split:

| Piece | Lines | Responsibility |
|---|---|---|
| `pages/CourseDetail.jsx` (default export) | 280 | Access branching: not-found, not-owned → preview, owned-without-lessons, owned → `OwnedCourseView` |
| `OwnedCourseView` (in-file, ~50) | — | Fetches full lessons from protected endpoint (`getCourseLessons`), loading/error states |
| `CourseLearningView` (in-file, ~150) | — | Accordion state, sequential unlock, comments wiring, certificate download, course header + material |
| `components/course/LessonAccordionItem.jsx` | 124 | Lesson accordion row (video, PDFs, complete/next buttons, comments) |
| `components/course/LessonCommentsSection.jsx` | 173 | Student questions block (thread rendering, reply inline, image picker) |
| `components/course/CoursePreviewView.jsx` | 92 | Public non-owned preview |
| `components/course/CourseProgressCard.jsx` | 25 | Progress card + certificate download button |

Consumes `useAuth`, `useCourseCatalog`, `usePurchases`, `useProgress`, `useLessonComments`. Covered by smoke tests for the extracted components only; no page-level test. The in-file `OwnedCourseView`/`CourseLearningView` (~200 of 280 lines) are extractable, but they are cohesive view logic with shared state; extracting them into files would add indirection without reducing cognitive load much.

### 3. `useLessonComments` — `costura-app/src/hooks/useLessonComments.js` (78 lines)

Already extracted and tested. Dedicated hook with lazy per-lesson load (always refetch on open), optimistic send (with optional parentId/image via multipart), per-lesson drafts, `sendingFor`. Test coverage: `src/hooks/useLessonComments.test.jsx` (225 lines). Currently consumed only by `CourseDetail.jsx` (line 142). No remaining hook-vs-inline question — this candidate is closed.

### 4. `CourseCatalogContext` — `costura-app/src/context/CourseCatalogContext.jsx` (82 lines)

Lean, single-responsibility provider: `courses` list fetched on mount, `getCourseLessons`, and admin actions `addCourse`/`updateCourse`/`deleteCourse`, memoized value. Already slimmed in `2026-08-21-code-quality-refactor` (dead `saveCourses`/lesson actions removed, see in-code comment lines 62-66). The admin CRUD actions are a slight smell (student-facing context exposing admin mutators), but splitting would create a second provider in the already-deep gate for ~20 lines of API wrappers — premature. Consumers: Courses, CourseDetail, Checkout, MyCourses, Favorites, Dashboard, AdminDashboard, AdminCourses, AdminUsers, AdminSales, AdminCourseForm. Defer.

### 5. `MyCourses` — `costura-app/src/pages/MyCourses.jsx` (132 lines)

Not modularized, but modest size. Mixes two distinct sections: the owned-course list (with progress bars) and a full notification inbox panel (read/unread, mark-as-read, mark-all, delete, empty/loading/error states). The notification panel (~55 lines of the file) duplicates list-row patterns also present in `components/Navbar.jsx`/`NotificationBell.jsx` (bell + dropdown). Extraction candidate: `components/NotificationsInbox.jsx` (or similar) receiving state from `useNotifications`.

### 6. `App` providers gate — `costura-app/src/App.jsx` (99 lines)

7-provider nesting (`AuthProvider > CourseCatalogProvider > PurchaseProvider > ProgressProvider > FavoritesProvider > NotificationsProvider > AdminProvider`) with 2 in-file layouts (`Layout`, `AdminLayout`) and 18 routes. Readable but deep; provider order is semantically meaningful (Progress depends on Purchases; Notifications/Favorites depend on Auth). Composition candidates: a `Providers` component (render-prop/children composition) to flatten indentation, and optionally splitting the routes/layouts out. Low risk, cosmetic-to-small win.

### 7. Additional findings (verified, not in the original candidate list)

| Finding | Evidence | Assessment |
|---|---|---|
| **Comment-thread rendering duplicated 2x** | `components/course/LessonCommentsSection.jsx` (renderComment/renderReply, image-attachment link, `groupCommentsByParent`) vs `components/admin/ConsultasSection.jsx` (renderReply/renderQuestion, same classes `ml-4 border-l-2 border-border-sage`, same image block, same `ImagePicker`) | Real duplication (~120 lines of near-identical JSX + reply form). Both use `utils/commentTree.js groupCommentsByParent`. Extraction: `components/CommentThread.jsx` with `canReply`/`showImagePicker`/role-label props. |
| **File-input styling duplicated 4x** | `CourseAttachmentsSection.jsx` L16 & L27, `LessonEditorItem.jsx` L48, `NewLessonForm.jsx` L44 — identical `file:mr-4 file:py-2 file:px-4 file:rounded-full ...` Tailwind string | Extract `components/FilePicker.jsx` (accept/multiple/onChange/label). |
| **`ConsultasSection.jsx` oversized** | `components/admin/ConsultasSection.jsx` (305 lines): data fetch + 2 filters + answered/unanswered partitioning + recursive thread render + inline reply form, single component | The largest component in `src/`. Splitting fetch/filter (custom hook `useAdminComments` or reuse) from rendering is the real win, plus it absorbs the shared `CommentThread` extraction. |
| `AdminUsers.jsx` | 242 lines, 2 inline modals + table + search | Bounded; moderate value. Optional. |
| `AdminSales.jsx` | 192 lines, table + summary cards + bar chart | Bounded; low urgency. Defer. |
| `AdminCourseForm` unused state | `editedLessons` never read for `description` on save (L115 falls back to `lesson.description`), `setLessonPdfFiles` reset to `[]` (L124) is a no-op write of the same shape | Small hygiene cleanup while touching the file. |
| `AdminContext` | 16 lines, `getAllUsers`/`toggleUserActive` wrappers only | Defer — the archive-flagged dead `deleteUser` is already gone. |

## Assessment per candidate

| Candidate | Verdict | Reasoning |
|---|---|---|
| 1. `AdminCourseForm` | **DONE — no work** | Already split into 4 components + smoke-tested. Further splitting is premature (state is cohesive). |
| 2. `CourseDetail` | **MOSTLY DONE** | Extracted components cover the heavy pieces. Remaining in-file views are cohesive. Optionally extract `OwnedCourseView`/`CourseLearningView` to files; low value, adds props-only indirection. |
| 3. `useLessonComments` | **DONE — no work** | Extracted + tested. |
| 4. `CourseCatalogContext` split | **DEFER — premature** | 82 lines, single responsibility, memoized. Splitting adds gate depth for no cognitive-load win. |
| 5. `MyCourses` | **LIGHT SPLIT** | Extract notification inbox to `components/NotificationsInbox.jsx`; leaves the course-list page focused. |
| 6. `App` providers gate | **COMPOSE** | Extract `Providers` composition (and optionally `AppRoutes` + layouts). Flattens nesting, preserves order. |
| 7a. Comment-thread duplication | **EXTRACT (primary win)** | Shared `CommentThread` component consumed by `LessonCommentsSection` + `ConsultasSection`. Removes the single largest real duplication in `src/`. |
| 7b. File-input duplication | **EXTRACT (quick win)** | Shared `FilePicker` for 4 identical className strings. |
| 7c. `ConsultasSection` split | **EXTRACT (primary win)** | Hook out data/filter logic (`useAdminComments`); render through `CommentThread`. 305 → ~150 lines of pure view. |

### Proposed component boundaries (if in scope)

```
src/components/
├── CommentThread.jsx        # recursive thread renderer + inline reply (props: items, onReply, labels, canReply, replySending)
├── FilePicker.jsx           # styled file input (props: accept, multiple, onChange, children/label)
├── NotificationsInbox.jsx   # notification list panel from MyCourses (props via useNotifications)
└── (App) providers.jsx      # Providers composition component (optional)
```

Risks:
- **Props drilling / contract churn**: `CommentThread` must satisfy two slightly different behaviors (student view: "Vos"/"Profesora" labels + main draft form; admin view: "Alumna" label + answered badge + filters). If the two contexts are too divergent, the shared component grows conditional props — the classic over-abstraction failure. Mitigation: extract only the thread recursion + comment row + reply form; keep section-level chrome (filters, header badges) in each caller.
- **Context churn**: none of the candidates introduce new contexts. `CourseCatalogContext` split is explicitly deferred to avoid gate churn.
- **Test breakage**: no page-level tests exist for CourseDetail/AdminCourseForm/MyCourses/App; smoke tests render the extracted components statically with props and would need their import paths updated only if components are renamed or moved. `useLessonComments.test.jsx` unaffected. Risk is low but so is safety-net coverage — visual regression risk on the admin consultas inbox is the highest (no tests at all for `ConsultasSection`).
- **Behavior drift**: moving code across files must not change the "always refetch comments on open" and "backend-authoritative" semantics; review must diff the thread renderer carefully.

## Recommended scope

**In scope (bounded, outcome-focused):**
1. Extract `components/CommentThread.jsx`; rewire `LessonCommentsSection` and `ConsultasSection` to use it. (Primary win — removes ~120 lines of duplicated thread rendering.)
2. Extract `components/FilePicker.jsx`; replace the 4 identical file-input className blocks.
3. Extract `components/NotificationsInbox.jsx` from `MyCourses.jsx` (notification panel).
4. `App.jsx`: extract `Providers` composition (and optionally `AppRoutes`) to flatten the gate.
5. Hygiene while touching `AdminCourseForm` if the above already touches it: drop dead `editedLessons.description` read / no-op `setLessonPdfFiles` reset. (Only if edits happen there; not worth a dedicated task otherwise.)

**Deferred (with reasoning):**
- `CourseCatalogContext` split — premature; 82-line single-responsibility provider, and the admin-mutator smell is minor.
- `AdminCourseForm` / `CourseDetail` further decomposition — already modularized; remaining in-file views are cohesive.
- `AdminUsers` (242 lines) / `AdminSales` (192 lines) splits — bounded but low value vs churn; separate future change if desired.
- `useLessonComments` — done; nothing to do.

**Estimated size**: ~250-350 changed lines (one PR, comfortably under the 400-line review budget).

## Risks

- Comment-thread extraction is the highest-risk item: two callers with divergent labels/badges; over-parameterizing the shared component would hurt more than the duplication. Keep the shared surface minimal and diff-verify both UIs.
- No test coverage for `ConsultasSection` or `MyCourses`; visual regression on the admin inbox and student inbox is only caught by manual pass.
- Provider composition in `App.jsx` is behavior-preserving only if provider order is kept identical — review must enforce that.
- Moving `MyCourses` notification panel changes no data flow (all state from `useNotifications`), but the page's remaining shell must keep the empty/loading/error states consistent.

## Ready for Proposal

Yes — but the orchestrator should tell the user the headline finding: **most of the archived candidate list is already implemented** (AdminCourseForm, CourseDetail, useLessonComments were handled by the `refactor/frontend-page-split` PRs). The genuine remaining modularization is smaller than the debt list implies: shared `CommentThread`, shared `FilePicker`, `NotificationsInbox` extraction, `App` providers composition, plus optional `ConsultasSection` data-hook split.
