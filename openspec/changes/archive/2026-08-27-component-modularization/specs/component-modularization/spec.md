# Component Modularization Specification

## Purpose

Defines the structural outcome of the `component-modularization` refactor in `costura-app/`: extraction of duplicated comment-thread and file-input rendering, notification inbox, admin-comments data logic, flattened provider composition, and dead-state hygiene. This is a behavior-preserving refactor — it MUST NOT introduce user-facing behavior changes.

## Requirements

### Requirement: Shared CommentThread component

The system MUST provide a `components/CommentThread.jsx` module rendering the recursive comment tree plus inline reply form. The student view (`components/course/LessonCommentsSection.jsx`) and the admin view (`components/admin/ConsultasSection.jsx`) MUST render their thread content through it.

Per-side labels/badges ("Vos"/"Profesora" vs "Alumna"/"Respondida") and section-level chrome (filters, header badges) SHALL remain in the callers. The shared component MUST NOT contain per-caller conditional chrome.

#### Scenario: Both views render through the shared component

- GIVEN `CommentThread.jsx` exists
- WHEN `LessonCommentsSection` and `ConsultasSection` import and render it
- THEN both views produce their original labels, badges, and reply behavior

#### Scenario: Minimal shared surface

- GIVEN the two callers have divergent labels and badges
- WHEN the shared component renders with caller-supplied labels
- THEN no per-caller conditional chrome exists inside `CommentThread.jsx`

### Requirement: Shared FilePicker component

The system MUST provide a `components/FilePicker.jsx` module for styled file inputs. The four file-input blocks (`CourseAttachmentsSection` cover image and course PDFs, `LessonEditorItem` PDFs, `NewLessonForm` PDFs) MUST render through it.

#### Scenario: All file inputs use FilePicker

- GIVEN `FilePicker.jsx` exists
- WHEN the four file-input sites render their pickers
- THEN each renders via `FilePicker` with identical accept, multiple, and onChange behavior

### Requirement: Admin comments data hook

The system MUST provide a `hooks/useAdminComments.js` module encapsulating fetch, filters, and answered/unanswered partitioning for admin consultas. `ConsultasSection.jsx` MUST consume it and render threads via `CommentThread`, remaining a pure view of at most 150 lines.

#### Scenario: ConsultasSection becomes a pure view

- GIVEN `useAdminComments.js` exists
- WHEN `ConsultasSection` consumes it and renders threads
- THEN the section holds no fetch/filter logic and stays within the line budget

### Requirement: NotificationsInbox extraction

The system MUST provide a `components/NotificationsInbox.jsx` module holding the notification panel (list, mark-as-read, mark-all, delete, empty/loading/error states), consuming `useNotifications` from `context/NotificationsContext.jsx`. `pages/MyCourses.jsx` MUST render it instead of inline panel code.

#### Scenario: Empty, loading, and error states preserved

- GIVEN notifications are loading, empty, or failed
- WHEN `MyCourses` renders `NotificationsInbox`
- THEN the corresponding loading/empty/error UI appears unchanged

### Requirement: Flattened provider composition

The system MUST extract the seven providers in `src/App.jsx` into a composition that preserves the exact current nesting order: `AuthProvider`, `CourseCatalogProvider`, `PurchaseProvider`, `ProgressProvider`, `FavoritesProvider`, `NotificationsProvider`, `AdminProvider`.

#### Scenario: Provider order unchanged

- GIVEN the extracted composition
- WHEN the app mounts
- THEN each provider's parent is identical to the pre-refactor nesting

### Requirement: AdminCourseForm hygiene

The system MUST remove the dead `editedLessons.description` fallback and the no-op `setLessonPdfFiles([])` reset in `pages/admin/AdminCourseForm.jsx` without altering save behavior.

#### Scenario: Dead paths removed

- GIVEN a lesson with empty `description` on save
- WHEN the course is saved
- THEN `lesson.description` is used as the value and no `setLessonPdfFiles([])` call executes

### Requirement: Refactor verification

The change MUST add Vitest coverage for the new units and MUST keep `npm test` and `npm run build` green in `costura-app/`. The refactor MUST NOT alter any user-facing behavior, API contracts, or data flow.

#### Scenario: Tests and build pass

- GIVEN the refactored modules in place
- WHEN `npm test` and `npm run build` run in `costura-app/`
- THEN all tests pass and the production build succeeds
