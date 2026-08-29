# Proposal: UI Flat Redesign (eliminate "card inside card")

## Intent

Eliminate nested-box visual stacking across `costura-app/` while keeping every page's information identical. Grounded in the exploration inventory: a repeated page-header banner box on 10 pages, outer wrapper cards (Dashboard, MyCourses, AdminRequests, AdminCourseForm panels), and depth-3 hotspots (Checkout, AdminCourseForm, AdminUsers modal, Profile toast). Standing rule: nesting depth ≤1 — page surface → content card → chips/pills/progress only.

## Scope

### In Scope
- **Phase A (broad, low-risk)**: Remove the page-header banner box on all 10 pages → flat typographic header (h1 + subtitle, pink accent). Remove outer wrapper cards (Dashboard, MyCourses, AdminRequests, AdminCourseForm panels). Extract shared `PageHeader` (+ `Surface` only if it reduces drift).
- **Phase B (targeted)**: Flatten depth-3 hotspots — Checkout transfer steps, AdminCourseForm (`LessonEditorItem`/`NewLessonForm`/`CourseAttachmentsSection` inner boxes), AdminUsers modal, Profile saved-toast.
- Cap nesting depth ≤1 everywhere; keep neon `card-glow` as the single surface per view.

### Out of Scope
- No information/content changes or reordering; no backend/API changes; no new features.
- No full-bleed redesign; no removing comment/notification affordances or input borders; no pink-neon identity changes.
- Chips, pills, progress bars, comment bubbles, notification rows stay (affordances, not boxes).

## Capabilities

> Contract with sdd-spec. Researched `openspec/specs/` — only `design-system` changes at spec level.

### New Capabilities
None.

### Modified Capabilities
- `design-system`: adds nesting-depth ≤1 rule, flat typographic page headers, single-surface-per-view rule.

## Approach

Hybrid of exploration Approaches 3+4 as core, selective 1/2 for hotspots. Phase A = broad sweep (header banner + outer wrappers + shared `PageHeader`). Phase B = whitespace + `.seam-divider` + tints for depth-3 spots. Ship as 3 chained PRs by area: public → student → admin.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `costura-app/src/pages/*` (10 pages) | Modified | Header banner box → flat typographic header |
| `pages/Dashboard.jsx`, `MyCourses.jsx`, `admin/AdminRequests.jsx` | Modified | Outer wrapper card removed |
| `pages/Checkout.jsx`, `admin/AdminCourseForm.jsx`, `admin/AdminUsers.jsx`, `Profile.jsx` | Modified | Depth-3/2 hotspots flattened |
| `components/admin/{LessonEditorItem,NewLessonForm,CourseAttachmentsSection}.jsx` | Modified | Inner boxes removed |
| `components/PageHeader.jsx` (new) | New | Shared flat header component |
| `costura-app/src/index.css` | Modified | Verify mobile `section+section` ≤640px rule |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| No page-level/visual tests; layout regressions missed by CI | High | Manual visual QA per page per area |
| Admin table/row scannability drops without card chrome | Med | Keep single surface + row borders |
| Mobile `section+section` ≤640px rule interacts with flattened sections | Med | Verify on mobile ≤640px per page |
| Copy-paste drift during class sweep | Med | Shared `PageHeader`/`Surface` prevents re-duplication |
| Comment/notification affordances accidentally flattened | Low | Explicit non-goal; preserve unread/bubble state |

## Rollback Plan

CSS/JSX-only className changes; no data/API impact. Rollback = revert the PR(s). Each area (public / student / admin) ships as a separate chained PR and is independently revertible.

## Dependencies

- None (frontend-only).

## Success Criteria

- [ ] Max nesting depth ≤1 on every page (audit vs inventory).
- [ ] Flat typographic header on all 10 pages; consistent across pages.
- [ ] One surface (`card-glow`) per view; chips/pills/progress preserved.
- [ ] Page information identical pre/post (no content added/removed/reordered).
- [ ] `npm run lint` + `npm run build` + `npm test` green per chained PR.
- [ ] Manual visual QA pass per area (public, student, admin).
