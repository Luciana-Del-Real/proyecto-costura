# Design: Component Modularization

## Technical Approach

Implement a behavior-preserving, leaf-first frontend refactor under `costura-app/src`. Reuse the existing Context API, `services/api.js`, `groupCommentsByParent`, Tailwind conventions, and JSX/Vitest patterns. No API, route, or persisted-data changes are introduced.

## Architecture Decisions

| Decision | Alternatives considered | Rationale |
|---|---|---|
| One canonical `CommentThread` tree walk | Preserve `renderComment`/`renderReply` and `renderReply`/`renderQuestion` separately | Both callers already consume `groupCommentsByParent`; one recursive walk removes duplication without changing ordering. |
| `FilePicker` owns only the input and shared styling | Keep four inputs; add caller-specific styling props | A fixed surface prevents visual drift and preserves caller-specific state and selection semantics. |
| `useAdminComments` uses existing `get`, `post`, and `postForm` helpers | Inline `fetch`; add a new API service | Existing helpers preserve auth, JSON/FormData handling, and error behavior. |
| `Providers` in `src/components/providers.jsx` | Keep deeply nested JSX in `App.jsx`; render-prop wrapper | A children composition removes gate indentation while keeping the exact dependency order visible and testable. |

## Data Flow

```text
AdminDashboard → ConsultasSection → useAdminComments → api.get('/admin/comments')
                                      ↓ filters/partitions
                                  CommentThread → reply API → refresh

App → BrowserRouter → Providers (Auth > Catalog > Purchase > Progress > Favorites > Notifications > Admin) → Routes
```

## File Changes

| File | Action | Description |
|---|---|---|
| `src/components/FilePicker.jsx` | Create | Shared file input. Props: `accept`, `multiple`, `onChange`, `label`, `children`; render `children || label`. Exact class: `block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-primary-hover cursor-pointer`. |
| `src/components/CommentThread.jsx` | Create | Exact props: `{ items, onReply, labels, canReply, replySending, image }`; `items` is the flat list (or `{ topLevel, childrenOf }`), `labels` is `{ admin, author, date, reply, cancel, send, placeholder }`, and `image` is `{ preview, onChange, onRemove }` (optional). It calls `groupCommentsByParent` for flat lists, recursively renders rows, and owns inline reply draft/image UI. An optional caller-rendered badge slot in `labels` keeps the admin “Respondida” badge outside shared chrome. Main student composer remains in `LessonCommentsSection`; admin filters/header remain in `ConsultasSection`. |
| `src/hooks/useAdminComments.js` | Create | Returns `{ items, filters, setCourseFilter, setStudentFilter, courseOptions, unanswered, answered, loading, error, refresh, reply }`. Fetches `/admin/comments` with `get`; `reply` uses `post` or `postForm`, then refreshes. Partitioning follows top-level student questions and recursive ADMIN-descendant detection. |
| `src/components/admin/ConsultasSection.jsx`, `src/components/course/LessonCommentsSection.jsx` | Modify | Replace divergent render functions with `CommentThread`; retain each caller’s chrome, labels, main composer, and admin filters. Consultas becomes a pure view (≤150 lines). |
| `src/components/admin/{CourseAttachmentsSection,LessonEditorItem,NewLessonForm}.jsx` | Modify | Replace the three PDF inputs and cover input with `FilePicker`, preserving accept, multiple, and `Array.from`/single-file handlers. |
| `src/components/NotificationsInbox.jsx` | Create; `src/pages/MyCourses.jsx` modify | Inbox consumes `useNotifications` directly; no props are needed. Preserve loading, error, empty, list, mark-read, mark-all, and delete UI. MyCourses retains only course list/header and renders `<NotificationsInbox />`. |
| `src/components/providers.jsx`, `src/App.jsx` | Create/modify | `Providers({ children })` nests exactly `AuthProvider > CourseCatalogProvider > PurchaseProvider > ProgressProvider > FavoritesProvider > NotificationsProvider > AdminProvider`; `App` keeps `BrowserRouter` outside it and routes inside. |
| `src/pages/admin/AdminCourseForm.jsx` | Modify | Remove only the `editedLessons.description` fallback at L115 (use `lesson.description` directly) and the no-op `setLessonPdfFiles([])` at L124; save and upload behavior remain unchanged. |

## Interfaces / Contracts

`CommentThread` calls `onReply(comment, message, imageFile)` only when the trimmed message is non-empty; `canReply` gates reply controls and `replySending` disables send. `useAdminComments.reply` receives `(lessonId, questionId, message, imageFile)`. No caller-side filter state enters `CommentThread`.

## Testing Strategy

| Layer | What to Test | Approach |
|---|---|---|
| Unit | `CommentThread` | `src/components/CommentThread.test.jsx`; static markup for recursive nesting, supplied labels, image, reply gating, and sending state. |
| Unit | `FilePicker` | `src/components/FilePicker.test.jsx`; assert exact class, accept/multiple, label/children, and change callback. |
| Unit | `useAdminComments` | `src/hooks/useAdminComments.test.jsx`; mock `services/api`, assert fetch, filters, FIFO unanswered/reverse answered partition, reply JSON/FormData, loading/error. |
| Unit | `NotificationsInbox` | `src/components/NotificationsInbox.test.jsx`; mock context and assert loading/error/empty plus mark/delete actions. Update `smoke.test.jsx` imports/assertions as needed. |
| Verification | Whole frontend | Run `npm test` and `npm run build` in `costura-app`. |

## Threat Matrix

N/A — no routing, shell, subprocess, VCS/PR automation, executable-file classification, or process-integration boundary is changed.

## Migration / Rollout

No migration required. Apply in order: FilePicker → CommentThread → useAdminComments → NotificationsInbox → Providers → hygiene. Later steps depend on earlier imports/contracts; each step is independently diff-verified before proceeding.

## Open Questions

None.
