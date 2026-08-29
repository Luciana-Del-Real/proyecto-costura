# Delta for design-system

## ADDED Requirements

### Requirement: Nesting-depth ≤1 rule

System MUST keep box nesting depth ≤1 on every view: page surface → content card → chips/pills/progress only. No box (`.card*`, `bg-white …border…`, `rounded-* border` surface) MAY be nested inside another box beyond that single content level. Page information MUST remain identical pre/post.

- **Depth capped** — GIVEN a rendered view, WHEN box class strings are inspected, THEN no box class appears inside another box class beyond depth 1.
- **Affordance exempt** — GIVEN a content card, WHEN it contains chips, pills, progress bars, or notification rows, THEN those are NOT counted as boxes for depth purposes.

### Requirement: Flat typographic page headers

Page headers on the 10 banner pages (Courses, PatronesGratis, Favorites, MyCourses, Profile, AdminUsers, AdminCourses, AdminPatterns, AdminSales, AdminRequests) MUST render as typography (h1 + subtitle, pink accent), NOT a boxed banner. The header banner box class MUST NOT appear on any page. Headers MUST render regardless of empty content state.

- **Banner gone** — GIVEN any of the 10 pages renders, WHEN its header region is inspected, THEN it contains no banner-box class and renders an h1 with subtitle.
- **Empty-state header** — GIVEN a page whose content list is empty, WHEN rendered, THEN the typographic header still renders.

### Requirement: Single-surface-per-view

Each view MUST contain at most ONE boxed surface (`.card-glow` or similar). Outer wrapper cards (Dashboard, MyCourses, AdminRequests, AdminCourseForm panels) MUST be removed. Depth-3 hotspots (Checkout transfer steps, AdminCourseForm inner boxes, AdminUsers modal, Profile saved-toast) MUST be flattened to ≤1 surface.

- **One surface** — GIVEN a view renders, WHEN boxed-surface instances are counted, THEN there is at most one.
- **Flat stat/rows** — GIVEN AdminUsers modal stat rows or Checkout CVU rows, WHEN rendered, THEN they are flat (border-b/divide-y/whitespace), not nested boxes.

### Requirement: PageHeader shared component

System MUST provide `components/PageHeader.jsx` — a thin, presentational component accepting a `title` and optional `subtitle`, with an optional pink accent — that MUST NOT render a box. Pages that previously had the header banner MUST consume `PageHeader`.

- **Component exists** — GIVEN `components/PageHeader.jsx`, WHEN imported, THEN it exports a component consuming `title`/`subtitle` props.
- **Not a box** — GIVEN `PageHeader` renders, THEN its root contains no box-surface class.

### Requirement: Affordances preserved

Chips, pills, progress bars, comment bubbles, notification rows, and input borders are affordances, NOT boxes. System MUST leave them unchanged and MUST NOT remove input borders (`border-border`/`rounded-xl`).

- **Affordances kept** — GIVEN a chip, pill, progress bar, comment bubble, or notification row renders, WHEN compared, THEN it is unchanged from before this change.
- **Input borders kept** — GIVEN an input field renders, WHEN its classes are inspected, THEN its border and radius are retained.
