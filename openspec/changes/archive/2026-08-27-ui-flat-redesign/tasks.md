# Tasks: UI Flat Redesign

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~60–100 across ~25–30 files (3 slices) |
| 400-line budget risk per PR | Low |
| Chained PRs recommended | Yes |
| Suggested split | PR1 public → PR2 student → PR3 admin |
| Delivery strategy | ask-on-risk |
| Chain strategy | stacked-to-main |

```
Decision needed before apply: No
Chained PRs recommended: Yes
Chain strategy: stacked-to-main
400-line budget risk: Low
```

### Suggested Work Units

| Unit | Goal | Likely PR | Focused test | Runtime harness | Rollback boundary |
|------|------|-----------|--------------|-----------------|-------------------|
| 1 | PageHeader + public headers | PR1 | `npm test` (PageHeader, smoke) in costura-app | `npm run dev` → Courses/PatronesGratis/Favorites | revert PageHeader.jsx + 3 pages |
| 2 | Student headers/wrappers/hotspots | PR2 | `npm test` in costura-app | dev → Dashboard/MyCourses/Profile/Checkout, ≤640px | revert 4 student files |
| 3 | Admin headers/wrappers/hotspots | PR3 | `npm test` in costura-app | dev → 6 admin pages + form, ≤640px | revert admin files + 3 components |

## PR1 — Public

- [x] 1.1 Create `components/PageHeader.jsx` with `title`, optional `subtitle`, `accent` (no box classes).
- [x] 1.2 Add `components/PageHeader.test.jsx`: title, subtitle, accent, empty-state render, no box class on root.
- [x] 1.3 Replace banner `bg-white rounded-2xl border-2 border-primary shadow-md px-4 py-10` in `pages/Courses.jsx` with `<PageHeader>` (title only).
- [x] 1.4 Replace banner in `pages/PatronesGratis.jsx`; keep pattern cards as surfaces.
- [x] 1.5 Replace banner in `pages/Favorites.jsx`; keep CourseCard surfaces.
- [x] 1.6 Update `components/smoke.test.jsx` imports/mocks if `PageHeader` affects renders.
- [x] 1.7 Verify: `npm test`, `npm run lint`, `npm run build` in costura-app.
- [x] 1.8 Manual QA public: headers, filters, empty states; audit class strings depth ≤1. — **COMPLETED by owner 2026-08-27: all OK.**

## PR2 — Student

- [x] 2.1 Replace banner in `pages/MyCourses.jsx`; remove page wrapper, keep rows + `NotificationsInbox` surface.
- [x] 2.2 Replace banner in `pages/Profile.jsx`; move avatar to flat `bg-primary-soft rounded-full` identity row.
- [x] 2.3 Remove `Dashboard.jsx` outer `card-glow`; keep course cards.
- [x] 2.4 `Checkout.jsx`: order-summary `card-glow` sole surface; transfer steps seam-separated, CVU/Alias rows `border-b`, warning tinted notice.
- [x] 2.5 `Profile.jsx` hotspots: saved toast → inline `text-primary text-sm px-0 py-2 mb-4`; purchase history flat divider section; personal card sole surface.
- [x] 2.6 Preserve `NotificationsInbox.jsx` affordances (unchanged).
- [x] 2.7 Verify: `npm test`, `npm run lint`, `npm run build`; mobile ≤640px QA on student pages.
- [x] 2.8 Manual QA: Dashboard/MyCourses/Notifications, Profile toast, Checkout payment/copy; depth ≤1 audit. — **COMPLETED by owner 2026-08-27: all OK.** — **Owner work, deferred.** Static-audit half completed in this batch (see apply-progress PR2 Static Audit); browser QA remains for the owner.

## PR3 — Admin

- [x] 3.1 Replace banner in `pages/admin/AdminUsers.jsx`; modal stats → `divide-y`/bordered rows (modal shell sole surface).
- [x] 3.2 Replace banner in `pages/admin/AdminCourses.jsx` and `AdminPatterns.jsx`.
- [x] 3.3 Replace banner in `pages/admin/AdminSales.jsx` and `AdminRequests.jsx`; `AdminRequests` rows → flat `p-3 border-b border-border`, keep one list `card-glow`.
- [x] 3.4 `AdminCourseForm.jsx`: merge two `card-glow p-8` panels into one with `seam-divider`/spacing.
- [x] 3.5 `components/admin/LessonEditorItem.jsx`: flat lesson section, input borders kept, PDF box flat, attachments divider rows.
- [x] 3.6 `components/admin/NewLessonForm.jsx`: drop `card-glow`/dashed surface, keep controls.
- [x] 3.7 `components/admin/CourseAttachmentsSection.jsx`: remove both `bg-white rounded-xl` upload boxes; labels/pickers flat.
- [x] 3.8 Verify `index.css` mobile `section+section` ≤640px rule on flattened sections. — **Verified, no change needed**: zero `<section>` elements in `pages/admin` + `components/admin` (all `div`s); the L537 rule only affects Home. Documented in apply-progress PR3.
- [x] 3.9 Verify: `npm test`, `npm run lint`, `npm run build`; mobile ≤640px QA on admin pages. — All green (13 files/91 tests, lint clean, build ok). Mobile ≤640px browser QA is owner work (deferred to 3.10).
- [x] 3.10 Manual QA: admin headers/actions, tables/rows, modal stats, form uploads/lesson CRUD; depth ≤1 audit. — **COMPLETED by owner 2026-08-27: all OK.** — **Owner work, deferred.** Static-audit half completed in this batch (see apply-progress PR3 Static Audit); browser QA remains for the owner.
