# Tasks: Design System Overhaul

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~1,900 total: PR1 ~600, PR2 ~450, PR3 ~350, PR4 ~450 |
| 400-line budget risk | Medium (PR1 High — single-file CSS rewrite) |
| Review budget (4,000) risk | Low |
| Chained PRs recommended | Yes |
| Suggested split | PR1 design-tokens → PR2 global-reset-public → PR3 global-reset-admin → PR4 hex-sweep |
| Delivery strategy | ask-on-risk |
| Chain strategy | pending |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: pending
400-line budget risk: Medium

### Suggested Work Units

| Unit | Goal | Likely PR | Focused test command | Runtime harness | Rollback boundary |
|------|------|-----------|----------------------|-----------------|-------------------|
| 1 | Semantic `@theme` tokens, brown resolution, dead CSS (~920→~540 lines) | PR 1 | `npm run lint`; `npm run build` | Manual: `/`, `/cursos`, auth, dashboard, `/admin` — warm parity | Revert PR1; `src/index.css`, `src/fonts-local.css` only |
| 2 | Public reset, `!`-fixes, Stage B public redesign | PR 2 | `npm run lint`; `npm run build` | Manual: auth, catalog filters/search, lesson/comment, checkout, dashboard/profile/favorites, mobile | Revert PR2; public pages + `Navbar`, `Footer`, `CourseCard` |
| 3 | Admin reset, `!`-fix, admin redesign | PR 3 | `npm run lint`; `npm run build` | Manual: dashboard, courses CRUD, users toggle, requests approve/reject, sales, mobile | Revert PR3; `App.jsx`, `AdminNavbar.jsx`, `pages/admin/*` |
| 4 | Hex sweep: arbitrary colors → semantic utilities | PR 4 | lint/build; grep v3 `!`-prefix over `src/` = 0 | Manual: repeat every route, desktop + mobile | Revert PR4; all `src/**/*.jsx`, remaining CSS |

## Phase 1: design-tokens (PR 1)

- [x] 1.1 Rewrite `@theme` in `src/index.css` with token contract (colors, fonts, radii, shadows); keep `@font-face` in `src/fonts-local.css`.
- [x] 1.2 Delete `:root` (L43–80) and dead `@theme` rosa/fucsia/verde (L82–91); remap every `var(--brown*)` reference to token vars, no aliases.
- [ ] 1.3 Delete hex class maps (L300–350), dead helpers/forced `!important` rules (L352–452), section pseudo-panels (L721–800); reach ~540 lines.
- [ ] 1.4 Verify: zero `var(--brown*)` and `[class*=hex]` remain; lint + build pass; parity pass on `/`, `/cursos`, auth, dashboard, `/admin`; Playfair/Dancing font load (open question).

## Phase 2: global-reset-public (PR 2)

- [ ] 2.1 Remove global heading/img/card/button rules (L105–178, L186–189) from `index.css`; migrate `Home.jsx`, `Courses.jsx`, `CourseDetail.jsx`, `Checkout.jsx`, `Auth.jsx`, `Dashboard.jsx`, `Profile.jsx`, `MyCourses.jsx`, `Favorites.jsx`, `ForgotPassword.jsx`, `ResetPassword.jsx`, `Navbar.jsx`, `Footer.jsx`, `CourseCard.jsx` to token utilities (`bg-bg-surface`, `text-text-ink`, `text-primary`).
- [ ] 2.2 Fix `!`-prefix: `Courses.jsx` L45–46 (4), `CourseCard.jsx` L104/L115 (2), `MyCourses.jsx` L30, `Favorites.jsx` L36, `Dashboard.jsx` L30 → suffix `!` or token classes.
- [ ] 2.3 Stage B public: Home cream canvas + cocoa-overlay hero, Bebas/Playfair headings sentence-case (brand displays excepted); cards, catalog, detail, checkout, authenticated pages.
- [ ] 2.4 Verify: lint + build; manual pass per unit table; `text-white` intent preserved on CTAs/navbar/footer.

## Phase 3: global-reset-admin (PR 3)

- [ ] 3.1 Migrate `App.jsx`, `AdminNavbar.jsx`, `pages/admin/AdminDashboard.jsx`, `AdminCourses.jsx`, `AdminCourseForm.jsx`, `AdminUsers.jsx`, `AdminRequests.jsx`, `AdminSales.jsx` to token utilities.
- [ ] 3.2 Fix `!text-white` in `AdminCourses.jsx` L14/L43; apply Stage B admin treatment (beige stays beige #F9F5F0).
- [ ] 3.3 Verify: lint + build; manual pass dashboard, courses new/edit/delete, users toggle, requests approve/reject, sales, mobile.

## Phase 4: hex-sweep (PR 4)

- [ ] 4.1 Sweep all `src/**/*.jsx` arbitrary hex classes (`bg-[#…]`, `text-[#…]`, `hover:bg-[#…]`) → semantic utilities incl. hover variants.
- [ ] 4.2 Delete remaining dead CSS in `index.css`; grep v3 `!`-prefix over `src/` returns zero.
- [ ] 4.3 Verify: lint + build; repeat manual pass on every route, desktop + mobile.

## Non-blocking dependency

- [ ] NOTE: level-badge enum, localhost hardcodes, reset-password, profile persist stay in the separate bugfix change; manual passes note gray badges/broken images.