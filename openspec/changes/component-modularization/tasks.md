# Tasks: Component Modularization

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 250–350 |
| 400-line budget risk | Low |
| Chained PRs recommended | No |
| Suggested split | Single PR |
| Delivery strategy | ask-on-risk |
| Chain strategy | pending |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: Low

### Suggested Work Units

| Unit | Goal | Likely PR | Focused test command | Runtime harness | Rollback boundary |
|------|------|-----------|----------------------|-----------------|-------------------|
| 1 | FilePicker + 4 input sites | PR 1 | `npm test -- FilePicker` | Manual: course editor inputs | Revert commit 1 |
| 2 | CommentThread + 2 callers | PR 1 | `npm test -- CommentThread` | Manual: student/admin threads | Revert commit 2 |
| 3 | useAdminComments + ConsultasSection | PR 1 | `npm test -- useAdminComments` | Manual: admin consultas filters | Revert commit 3 |
| 4 | NotificationsInbox + MyCourses | PR 1 | `npm test -- NotificationsInbox` | Manual: inbox states | Revert commit 4 |
| 5 | Providers + App.jsx | PR 1 | `npm test` | Manual: app boots | Revert commit 5 |
| 6 | AdminCourseForm hygiene | PR 1 | `npm test` | N/A — dead-code only | Revert commit 6 |

## Phase 1: FilePicker

- [x] 1.1 Create `src/components/FilePicker.jsx`: props `accept`, `multiple`, `onChange`, `label`, `children`; render `children || label`; exact className from design.md.
- [x] 1.2 Create `src/components/FilePicker.test.jsx`: assert class, accept/multiple, label/children, change callback.
- [x] 1.3 Rewire `CourseAttachmentsSection.jsx` cover + PDF inputs via FilePicker; preserve `Array.from`/single-file handlers.
- [x] 1.4 Rewire `LessonEditorItem.jsx` and `NewLessonForm.jsx` PDF inputs via FilePicker.

## Phase 2: CommentThread

- [ ] 2.1 Create `src/components/CommentThread.jsx`: props `{ items, onReply, labels, canReply, replySending, image }`; recursive `groupCommentsByParent` walk; no per-caller chrome; `onReply` fires only for non-empty trimmed message.
- [ ] 2.2 Create `src/components/CommentThread.test.jsx`: recursive nesting, supplied labels, image preview/remove, reply gating, sending state.
- [ ] 2.3 Rewire `src/components/course/LessonCommentsSection.jsx` via CommentThread; keep main composer + "Vos"/"Profesora" labels.
- [ ] 2.4 Rewire `src/components/admin/ConsultasSection.jsx` via CommentThread; keep filters + "Alumna"/"Respondida" badge (labels slot).

## Phase 3: useAdminComments

- [ ] 3.1 Create `src/hooks/useAdminComments.js`: `{ items, filters, setCourseFilter, setStudentFilter, courseOptions, unanswered, answered, loading, error, refresh, reply }`; fetch via `get`; `reply` via `post`/`postForm` + refresh; FIFO unanswered / reverse answered.
- [ ] 3.2 Create `src/hooks/useAdminComments.test.jsx`: mock `services/api`; assert fetch, filters, partition order, reply JSON/FormData, loading/error.
- [ ] 3.3 Rewire `ConsultasSection.jsx` to consume hook; remove inline fetch/filter logic; ≤150 lines.

## Phase 4: NotificationsInbox

- [ ] 4.1 Create `src/components/NotificationsInbox.jsx`: consume `useNotifications`; list, mark-read, mark-all, delete, loading/error/empty states unchanged.
- [ ] 4.2 Create `src/components/NotificationsInbox.test.jsx`: mock context; assert loading/error/empty + mark/delete actions.
- [ ] 4.3 Rewire `src/pages/MyCourses.jsx`: replace inline panel with `<NotificationsInbox />`; keep course list/header.

## Phase 5: Providers

- [ ] 5.1 Create `src/components/providers.jsx`: `Providers({ children })` nests Auth > CourseCatalog > Purchase > Progress > Favorites > Notifications > Admin exactly.
- [ ] 5.2 Modify `src/App.jsx`: `BrowserRouter` outside `<Providers>`, routes inside; remove nested gate.
- [ ] 5.3 Update `src/components/smoke.test.jsx` imports/assertions as needed; `npm test` green.

## Phase 6: AdminCourseForm Hygiene

- [ ] 6.1 Modify `src/pages/admin/AdminCourseForm.jsx`: replace L115 `(editedLessons[lesson.id]?.description ?? lesson.description) || ''` with `lesson.description`; remove no-op `setLessonPdfFiles` reset at L124; save behavior unchanged.

## Phase 7: Verification

- [ ] 7.1 Run `npm test` in `costura-app/` — all pass including new unit tests.
- [ ] 7.2 Run `npm run build` in `costura-app/` — production build succeeds.
- [ ] 7.3 Manual visual pass: student/admin threads, admin filters, inbox states, editor inputs.
