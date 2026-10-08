# Admin shell redesign (sidebar) + page chrome cleanup

## Objective

Replace the crowded admin top navbar with a **left sidebar** layout, so the navigation is easy to scan and the institution/professor name always has room. Normalize the admin pages to the project design system so everything is clean, consistent and free of container-in-container nesting.

## Problem

- `AdminNavbar.jsx` packs 8 links + notification bell + user name/role + logout into a single `lg:flex` row with `gap-6` inside a `justify-between` bar. There is no `flex-wrap`, `overflow`, `min-w-0` or `flex-shrink-0`, so the brand block is compressed and the institution name **wraps/shrinks**.
- Admin pages are inconsistent: some use `min-h-screen bg-bg-surface` wrappers, some don't; search inputs use `border-gray-300` in some places and `border-border` in others; edit/delete buttons use ad-hoc colors; `AdminEvents.jsx` uses hardcoded hexes; the route for the course form is `/admin/courses/*` while its list is `/admin/cursos`.
- The project already has a design system that forbids nested boxes and boxed page banners; the admin area does not fully follow it.

## Decisions

- Navigation pattern: **left sidebar** (chosen by the user), grouped sections, mobile as a drawer.
- Tests and the design-system spec must be respected; where the spec pins current markup, update the test to the new shell (not the other way around).

## Binding rules to respect (design system)

- **Box nesting depth ≤ 1.** Only `card-flat`, `card-glow`, `card-glow-fixed` count as boxes; chips/pills/progress/notification rows are exempt.
- **One boxed surface per view** where the spec requires it (`/admin/ventas`, `/admin/solicitudes`, `/admin/cursos`, `/admin/patrones`, `/admin/usuarios`).
- **Flat typographic `PageHeader`** (h1 + subtitle), never a banner box.
- **Buttons** only via `.btn` + variants (canonical geometry, no white-background state).
- **Tokens only** from `@theme` in `src/index.css` (no hardcoded hexes; no `!important`).
- `lg` (1024px) is the admin breakpoint; keep it.

## Tasks

- [x] **T1** `AdminSidebar.jsx` (new): brand header (logo + full institution name, never truncated), grouped nav (Panel · Catálogo · Alumnas · Operaciones) with lucide icons and active states, user block (name + role + logout) at the bottom. Hidden below `lg`; drawer (overlay) above.
- [x] **T2** `AdminTopbar.jsx` (new): thin sticky bar (`h-14`, white, `border-b`). Left: hamburger (`lg:hidden`) + a lightweight breadcrumb ("Admin / Sección"). Right: `NotificationBell`.
- [x] **T3** `AdminLayout` (in `App.jsx`): `min-h-screen flex` → sidebar + `flex-1 min-w-0 flex flex-col` → topbar + `<main className="flex-1">`. Remove the old `AdminNavbar` usage (delete the file if unused).
- [x] **T4** Name/brand: institution name full and non-shrinking (sidebar header; mobile topbar shows it too). User name/role with guaranteed room.
- [ ] **T5** Normalize page chrome across the admin pages (AdminDashboard, AdminUsers, AdminCourses, AdminCourseForm, AdminPatterns, AdminPatternForm, AdminSales, AdminRequests, AdminCertificates, AdminEvents, AdminEventForm): one container convention, flat `PageHeader`, consistent vertical rhythm, unified search inputs (`border-border`), `.btn` variants only, remove hardcoded hexes, keep depth ≤ 1.
- [ ] **T6** Route consistency: move the course form routes from `/admin/courses/new|edit/:id` to `/admin/cursos/nuevo|editar/:id` and update every link.
- [ ] **T7** Tests: update `src/components/depthGuard.test.jsx` to the new shell; add `AdminSidebar.test.jsx` (groups render, active item, mobile drawer opens/closes).

## Scope

In: the admin shell (sidebar + topbar + layout), nav grouping, page chrome normalization, the named route fix, tests.

Out: deep per-page feature redesign (new functionality on each admin screen), the student area, backend changes.

## Acceptance criteria

- The navbar no longer holds 8 links; sections are grouped in a sidebar.
- The institution and professor names never wrap awkwardly or shrink.
- Every admin page follows the design system: one surface convention, flat headers, tokens only, no nested boxes.
- Mobile: navigation reachable via a drawer; content usable at small widths.
- `npm test`, `npm run lint` and `npm run build` pass.

## Verification

- `cd costura-app && npm test`, `npm run lint`, `npm run build`.
- Manual: open every `/admin/*` route at desktop and mobile widths; check the name, grouping, active states, drawer, and that no box sits inside another.

## Delivery

Forecast: ~700-1000 authored lines across the shell and the page chrome. Repo flow is `dev` -> PR -> `main`; plan a single PR unless the user asks to split.

## Route per task

| Task | Route | Trigger evidence |
| --- | --- | --- |
| T1-T3 | delegated writer | new shell across several files |
| T4 | delegated writer | part of the shell work unit |
| T5 | delegated writer | multi-file page normalization |
| T6 | delegated writer | routes + links |
| T7 | delegated writer | tests for the new shell |

## Progress

- 2026-10-08: feature document created after exploration; navigation pattern decided (sidebar). Implementation not started.
- 2026-10-08: shell work unit done (T1-T4 + AdminSidebar tests). Added `AdminSidebar.jsx` and `AdminTopbar.jsx`, rewired `AdminLayout` in `App.jsx`, deleted `AdminNavbar.jsx`. Frontend 121 -> 129 tests passing, lint clean, build passing. Note: `BackToHome` is a fixed floating control already used by the public navbar, so the sidebar footer uses a plain "Ver sitio público" link instead. Remaining: T5 (page chrome normalization), T6 (route fix), and updating the depth guard test if T5 changes page roots.
- 2026-10-08 (user feedback): the brand moved to a normal full-width top navbar (logo + full institution name, never truncated) and the rest (grouped nav + notification bell + user + logout) lives in the sidebar. `NotificationBell` gained an `align` prop (`align="left"` in the sidebar) so its dropdown opens inward instead of clipping off the left edge. Added `AdminTopbar.test.jsx`; frontend 129 -> 132 tests. Commit `4c2e0db`.
