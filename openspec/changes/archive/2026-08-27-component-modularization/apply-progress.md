# Apply Progress: Component Modularization

- Change: `component-modularization`
- Branch: `dev`
- Mode: Standard (Strict TDD inactive — `config.yaml` `tdd: false`; tests written with each unit, per design)
- Delivery: single PR, 6 sequential work-unit commits, no chaining (forecast Low)
- Persistence: openspec file (Engram MCP tools unavailable in this session — file-only)

## Status Summary

| Phase | Tasks | Status |
|---|---|---|
| 1 FilePicker | 1.1–1.4 | Complete |
| 2 CommentThread | 2.1–2.4 | Complete |
| 3 useAdminComments | 3.1–3.3 | Complete |
| 4 NotificationsInbox | 4.1–4.3 | Complete |
| 5 Providers | 5.1–5.3 | Complete |
| 6 AdminCourseForm hygiene | 6.1 | Complete |
| 7 Verification | 7.1–7.2 done; 7.3 owner | 7.1, 7.2 complete |

**20/21 tasks complete.** Task 7.3 (manual visual pass) is OWNER work — not attempted by apply; documented as follow-up below.

## Work Unit Evidence

| Unit | Commit | Focused test command + result | Runtime harness | Rollback boundary |
|---|---|---|---|---|
| 1 FilePicker | `8f5d220` | `npx vitest run src/components/FilePicker.test.jsx src/components/smoke.test.jsx` → 2 files, 12 tests pass | N/A — static render surface; manual: course editor inputs (owner, 7.3) | Revert commit 1 |
| 2 CommentThread | `da95901` | `npx vitest run src/components/CommentThread.test.jsx src/components/smoke.test.jsx` → 2 files, 22 tests pass | N/A — component-level; manual: student/admin threads (owner, 7.3) | Revert commit 2 |
| 3 useAdminComments | `6f010bc` | `npx vitest run src/hooks/useAdminComments.test.jsx src/components/smoke.test.jsx` → 2 files, 14 tests pass | N/A — hook unit; manual: admin consultas filters (owner, 7.3) | Revert commit 3 |
| 4 NotificationsInbox | `209fa1f` | `npx vitest run src/components/NotificationsInbox.test.jsx src/components/smoke.test.jsx` → 2 files, 15 tests pass | N/A — component unit; manual: inbox states (owner, 7.3) | Revert commit 4 |
| 5 Providers | `c6f4d2a` | `npm test` → 12 files, 83 tests pass | N/A — composition reorder; manual: app boots (owner, 7.3) | Revert commit 5 |
| 6 AdminCourseForm hygiene | `0462aac` | `npm test` → 12 files, 83 tests pass | N/A — dead-code removal only | Revert commit 6 |

Final verification (tasks 7.1 / 7.2):
- `npm test` in `costura-app/` → **12 files, 83 tests passed** (baseline before change: 8 files, 56 tests).
- `npm run build` in `costura-app/` → **succeeds** (vite 8.0.3, 1843 modules, dist emitted).
- `npm run lint` in `costura-app/` → **clean** (0 errors, 0 warnings) — extra check; not part of the task list.

## Commits (in order)

1. `8f5d220` refactor(admin): extract shared FilePicker and rewire four file inputs
2. `da95901` refactor(comments): extract shared CommentThread for student and admin views
3. `6f010bc` refactor(admin): extract useAdminComments hook and slim ConsultasSection
4. `209fa1f` refactor(notifications): extract NotificationsInbox from MyCourses
5. `c6f4d2a` refactor(app): extract Providers composition and flatten App.jsx
6. `0462aac` refactor(admin): remove dead description fallback and lesson PDF reset

Plus (part of unit 1): devDependencies `@testing-library/react` + `@testing-library/dom` added, and `globals: true` in `vitest.config.js` (RTL auto-cleanup requires global `afterEach`; per-file `// @vitest-environment jsdom` used for interaction tests — `jsdom` was already a devDependency).

## Files Changed

| File | Action | What Was Done |
|---|---|---|
| `costura-app/src/components/FilePicker.jsx` | Created | Shared styled file input; exact className from design; `children || label` caption slot |
| `costura-app/src/components/FilePicker.test.jsx` | Created | Class/accept/multiple/label/children/change callback |
| `costura-app/src/components/admin/CourseAttachmentsSection.jsx` | Modified | Cover + course PDF inputs via FilePicker; labels/selection text preserved |
| `costura-app/src/components/admin/LessonEditorItem.jsx` | Modified | Lesson PDF input via FilePicker |
| `costura-app/src/components/admin/NewLessonForm.jsx` | Modified | New-lesson PDF input via FilePicker |
| `costura-app/src/components/CommentThread.jsx` | Created | Canonical recursive tree + inline reply form; `{ items, onReply, labels, canReply, replySending, image }` |
| `costura-app/src/components/CommentThread.test.jsx` | Created | Nesting, labels, badge slot, gating, sending, image, empty-message gating, success/failure close |
| `costura-app/src/components/course/LessonCommentsSection.jsx` | Modified | Thread via CommentThread; main composer + Vos/Profesora labels kept |
| `costura-app/src/components/admin/ConsultasSection.jsx` | Modified (twice) | Thread via CommentThread; then pure view on `useAdminComments` — 148 lines |
| `costura-app/src/hooks/useAdminComments.js` | Created | Fetch/filters/partition/reply; contract per design |
| `costura-app/src/hooks/useAdminComments.test.jsx` | Created | Mocked api; fetch, filters, FIFO/reverse partition, JSON/FormData reply, error |
| `costura-app/src/components/NotificationsInbox.jsx` | Created | Panel consuming `useNotifications`; states preserved exactly |
| `costura-app/src/components/NotificationsInbox.test.jsx` | Created | Mocked context; loading/error/empty + mark/delete actions |
| `costura-app/src/pages/MyCourses.jsx` | Modified | Inline panel → `<NotificationsInbox />`; header/course list kept |
| `costura-app/src/components/providers.jsx` | Created | Auth > CourseCatalog > Purchase > Progress > Favorites > Notifications > Admin |
| `costura-app/src/App.jsx` | Modified | BrowserRouter outside `<Providers>`, routes inside; provider imports removed |
| `costura-app/src/pages/admin/AdminCourseForm.jsx` | Modified | L115 fallback → `lesson.description`; no-op `setLessonPdfFiles` reset removed |
| `costura-app/vitest.config.js` | Modified | `globals: true` (RTL cleanup) |
| `costura-app/package.json` / `package-lock.json` | Modified | Added `@testing-library/react`, `@testing-library/dom` (dev) |
| `openspec/changes/component-modularization/tasks.md` | Updated | `[x]` marks for 20/21 tasks |
| `openspec/changes/component-modularization/apply-progress.md` | Created | This file |

## Deviations from Design

1. **Test infrastructure added** (`@testing-library/react` + `@testing-library/dom` devDeps, `globals: true`, per-file jsdom). The required interaction tests (change callbacks, reply gating, mark-read/delete) cannot run under the existing node-env `renderToStaticMarkup` setup; `jsdom` was already installed but unused. This is the enabling step for tasks 1.2/2.2/3.2/4.2.
2. **FilePicker does not render `lang="es"`.** Design specifies exact props (accept/multiple/onChange/label/children) and exact className, without `lang`; the cover input's `lang="es"` was the only site that had it, so omitting it preserves the 3 PDF inputs exactly (native dialog locale is browser-controlled anyway).
3. **Unified row layout in CommentThread** (single canonical row). The admin question card previously used a distinct style (non-uppercase name, badge-only header, date below message). With one shared row: author label is uppercase, badge renders in the header, and the date renders in the header right slot (matching admin reply rows). Labels, badge, reply behavior, and gating are preserved per spec scenarios; the visual differences are cosmetic and flagged for the owner visual pass (7.3).
4. **Admin reply form loses the separate in-form "Cancelar" button.** The toggle button below each row now reads "Responder"/"Cancelar" (student-style), which is the single dismissal path; the `cancel` label is used for that toggle. Behavior (dismiss reply) is preserved.

## Issues Found / Risks

1. **Removing `setLessonPdfFiles` reset (task 6.1)**: after a successful lesson save, `lessonPdfFiles[lesson.id]` keeps the just-uploaded files in state. A second save of the same lesson without picking new PDFs would re-upload the same files (duplicates). Design classifies this as a no-op and mandates removal; implemented exactly as specified, but flagged: if the owner observes duplicate PDFs on re-save during the visual pass, reinstate the reset line.
2. **`label`/`children` props of FilePicker are not used by the four callers** (they keep their labels above the input to avoid visual drift); the slots are covered by the unit test.
3. **ConsultasSection empty state** now reads `unanswered.length === 0 && answered.length === 0` (equivalent to the previous filtered-items check) — same user-visible behavior.

## Follow-up (OWNER)

- Task 7.3 manual visual pass: student/admin comment threads (labels, badges, reply forms, images), admin consultas filters + toggle, notifications inbox states (loading/error/empty/list, mark-read/mark-all/delete), course editor file inputs, app boot with new Providers nesting.

## Next

Ready for `sdd-verify` (tasks fully implemented; 7.3 is owner manual pass, not part of automated verify).