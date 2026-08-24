# Tasks: Design System Overhaul

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~2,250 total: PR1 ~600, PR2 (button-system) ~300, PR3 ~400, PR4 ~350, PR5 ~450 |
| 400-line budget risk | Medium (PR1 High — single-file CSS rewrite; PR2/PR5 Medium) |
| Review budget (4,000) risk | Low |
| Chained PRs recommended | Yes |
| Suggested split | PR1 design-tokens → PR2 button-system → PR3 global-reset-public → PR4 global-reset-admin → PR5 hex-sweep |
| Delivery strategy | ask-on-risk |
| Chain strategy | stacked-to-main |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: stacked-to-main
400-line budget risk: Medium

### Suggested Work Units

| Unit | Goal | Likely PR | Focused test command | Runtime harness | Rollback boundary |
|------|------|-----------|----------------------|-----------------|-------------------|
| 1 | Semantic `@theme` tokens, brown resolution, dead CSS (~920→~540 lines) | PR 1 | `npm run lint`; `npm run build` | Manual: `/`, `/cursos`, auth, dashboard, `/admin` — warm parity | Revert PR1; `src/index.css`, `src/fonts-local.css` only |
| 2 | Button system: canonical `.btn` geometry + variants in `index.css`, remove global button rule/machinery, sweep every `<button>`/`a.btn` to `btn` + variant | PR 2 | `npm run lint`; `npm run build`; grep `<button` for `btn` class | Manual: every route, all buttons share 44px height + 12px radius; disabled states | Revert PR2; `src/index.css` button layer + JSX button classNames |
| 3 | Public reset, `!`-fixes, Stage B public redesign | PR 3 | `npm run lint`; `npm run build` | Manual: auth, catalog filters/search, lesson/comment, checkout, dashboard/profile/favorites, mobile | Revert PR3; public pages + `Navbar`, `Footer`, `CourseCard` |
| 4 | Admin reset, `!`-fix, admin redesign | PR 4 | `npm run lint`; `npm run build` | Manual: dashboard, courses CRUD, users toggle, requests approve/reject, sales, mobile | Revert PR4; `App.jsx`, `AdminNavbar.jsx`, `pages/admin/*` |
| 5 | Hex sweep: arbitrary colors → semantic utilities | PR 5 | lint/build; grep v3 `!`-prefix over `src/` = 0 | Manual: repeat every route, desktop + mobile | Revert PR5; all `src/**/*.jsx`, remaining CSS |

## Phase 1: design-tokens (PR 1)

- [x] 1.1 Rewrite `@theme` in `src/index.css` with token contract (colors, fonts, radii, shadows); keep `@font-face` in `src/fonts-local.css`.
- [x] 1.2 Delete `:root` (L43–80) and dead `@theme` rosa/fucsia/verde (L82–91); remap every `var(--brown*)` reference to token vars, no aliases.
- [ ] 1.3 Delete hex class maps (L300–350), dead helpers/forced `!important` rules (L352–452), section pseudo-panels (L721–800); reach ~540 lines.
- [ ] 1.4 Verify: zero `var(--brown*)` and `[class*=hex]` remain; lint + build pass; parity pass on `/`, `/cursos`, auth, dashboard, `/admin`; Playfair/Dancing font load (open question).

## Phase 2: button-system (PR 2) — user directive: all buttons same shape (12px radius)

- [x] 2.1 Define canonical `.btn` base + variants (`.btn-primary` sage, `.btn-accent` berry, `.btn-ghost` transparent w/ border, `.btn-icon` square) in `@layer components` in `src/index.css`; add `--color-ring` token; geometry 44px height, padding 0 1.5rem, radius 12px, font-medium, focus-visible ring, disabled state; `.btn-hero` kept as size modifier.
- [x] 2.2 Replace/neutralize the global `button:not(.custom-btn)` rule (L187–223), `.btn-theme`/`.btn-eye`/`.btn-primary` old helpers (L398–422), forced-white + `text-white` hacks (L424–465), `.auth-card button` radius (L536–539), `.nav-on-hero .btn` (L887–888), `.filter-container`/`.filter-btn` block (L899–944) so buttons are styled ONLY by explicit `.btn` classes.
- [x] 2.3 Sweep every `<button>`/`a.btn`/`input[type=submit]` in `costura-app/src` by area: auth (login/register/forgot/reset), navbar/footer, courses/filters/cards, detail/checkout, profile/my-courses/favorites, admin (navbar/users/courses/form/requests); add `btn` + variant, remove redundant shape classes (`py-*`, `rounded-*`, `bg-[hex]`, `text-white`, `h-*`, `w-*` on icons).
- [x] 2.4 Verify: lint + build pass; grep every `<button` has a `btn` class (documented exceptions allowed); manual pass all routes for uniform 44px/12px shape.

## Phase 3: global-reset-public (PR 3)

- [x] 3.1 Remove global heading/img/card/button rules (L105–178, L186–189) from `index.css`; migrate `Home.jsx`, `Courses.jsx`, `CourseDetail.jsx`, `Checkout.jsx`, `Auth.jsx`, `Dashboard.jsx`, `Profile.jsx`, `MyCourses.jsx`, `Favorites.jsx`, `ForgotPassword.jsx`, `ResetPassword.jsx`, `Navbar.jsx`, `Footer.jsx`, `CourseCard.jsx` to token utilities (`bg-bg-surface`, `text-text-ink`, `text-primary`).
  - Global rules removed: h1-h3 forced color, `img/.object-cover`, `.bg-white/.card/rounded-*/border+shadow` list, `.mb-6`/`.border` !important, `.auth-card/.auth-tab/.auth-input`, `.visual-*`, `.logo-circle`, `.lvl-*`, `.bg-beige`, `.fill-brown-accent`, `.input-default`, `.text-brown-soft`, `.border-brown-accent`, `.font-playfair/.font-dancing/.font-handmade`, `.title/.accent-script/.subtitle/.body-text`, section.bg-* panels, `.section-centered-card`, duplicate `body`, duplicate `section.hero-no-sep + section`, `--animate-*` tokens, `--black*` palette + `.bg-black*` helpers, `.hover\:bg-*` helpers, `.text-accent`/`.bg-accent` !important duplicates.
  - Public JSX migrated to tokens: App shell `bg-[#F9F5F0]`→`bg-bg-surface`, CourseCard/Profile/Checkout `text-[#3D2B1F]`→`text-text-ink`, Dashboard `!text-black`→`text-text-ink`, Navbar/CourseDetail `hover:bg-soft(/)60`→`hover:bg-bg-soft(/)60`.
  - NOTE: remaining non-shim arbitrary hexes in public JSX (`text-[#6B4C3B]`, `bg-[#F4F1ED]`, `text-[#A08060]`, `focus:ring-[#7A9E7E]`, hover borders) are NOT shim-covered and go to PR5 hex-sweep (5.1).
- [x] 3.2 Fix `!`-prefix: `Courses.jsx` L45–46 (4), `CourseCard.jsx` L104/L115 (2), `MyCourses.jsx` L30, `Favorites.jsx` L36, `Dashboard.jsx` L30 → suffix `!` or token classes. (All but Dashboard L30 were already migrated in PR2's button sweep; Dashboard L30 `!text-black`→`text-text-ink` fixed in PR3. Grep over `src/` for v3 `!`-prefix classes now returns zero.)
- [ ] 3.3 Stage B public: Home cream canvas + cocoa-overlay hero, Bebas/Playfair headings sentence-case (brand displays excepted); cards, catalog, detail, checkout, authenticated pages. — DEFERRED: not in PR3 global-reset playbook scope (only App canvas → bg-bg-surface and heading-color reset landed); editorial treatment overlaps PR5.
- [x] 3.4 Verify: lint + build; manual pass per unit table; `text-white` intent preserved on CTAs/navbar/footer. (Lint: 22 problems = 20 errors + 2 warnings, IDENTICAL pre-existing baseline. Build PASSED. Manual pass checklist documented in apply-progress.)

## Phase 4: global-reset-admin (PR 4)

- [x] 4.1 Migrate `App.jsx` (already token-clean from PR3), `AdminNavbar.jsx`, `pages/admin/AdminDashboard.jsx`, `AdminCourses.jsx`, `AdminCourseForm.jsx`, `AdminUsers.jsx`, `AdminRequests.jsx`, `AdminSales.jsx` to token utilities.
  - All 8 remaining shim rules in `index.css` DELETED (`bg-[#F9F5F0]`, `bg-[#EAF0EA]`, `bg-[#F5E8E2]`, `bg-[#EDE4D6]`, `border-[#EDE4D6]`, `text-[#3D2B1F]`, `bg-[#7A9E7E]` + hover). Grep `[class*=`/`[style*=` over `src/` = 0 (only comment mentions remain).
  - Admin JSX migrated: page canvases `min-h-screen bg-[#F9F5F0]` → `bg-bg-surface`; beige panels/chips `bg-[#F9F5F0]` → `bg-bg-soft`; `bg-[#EAF0EA]` → `bg-primary-soft`; `bg-[#F5E8E2]`/`bg-[#EDE4D6]` → `bg-bg-soft`; `border-[#EDE4D6]` → `border-border`; `text-[#3D2B1F]`/`text-[#6B4C3B]` → `text-text-ink`; `text-[#5E8262]` → `text-success`; `bg-[#4E6D5B]`/`bg-[#7A9E7E]` → `bg-primary`; `text-[#4E6D5B]` → `text-primary`; `file:bg-[#4E6D5B] hover:file:bg-[#3e5849]` → `file:bg-primary hover:file:bg-primary-hover`; `focus:ring-[#7A9E7E]` → `focus:ring-primary`.
  - Legacy helpers migrated to generated utilities in admin only: `text-theme`→`text-text-ink`, `border-theme`→`border-border`, `text-secondary`→`text-primary`, `bg-theme/10`/`bg-theme/5`→`bg-bg-surface`, `auth-page-bg`→`bg-bg-surface` (AdminDashboard; helper now dead — PR5 5.2 cleans CSS). AdminNavbar/Dashboard hover states now actually render (`hover:bg-bg-soft`, `hover:text-primary` — the old helper hovers were inert).
  - Admin headings `text-black` → `text-text-ink` (Courses h3, Dashboard h2s) for warm-cocoa consistency with h1s.
  - Intentionally LEFT for PR5 hex-sweep (unique one-offs, not shim/token covered): `text-[#A08060]` (all admin files), stat-chip accents `text-[#A85E42]`/`text-[#A36700]`, warm/sage borders `border-[#F5EFE6]`, `border-[#E5E0D8]`, `divide-[#E5E0D8]`, `bg-[#E5E0D8]`, `hover:bg-[#F2EDE7]`, `bg-[#E5EADD]`, comment bubble `border-[#cfe0cf]`.
- [x] 4.2 `!text-white` in `AdminCourses.jsx` L14/L43: ALREADY fixed in PR2's button sweep (verified grep for v3 `!`-prefix over `src/` = 0 — task was pre-satisfied). Stage B admin treatment: beige stays beige — canvases render true `#F9F5F0` (`bg-bg-surface`, no more shim flattening to `#F5EDE4`), panels render soft beige `#F5EDE4` (`bg-bg-soft`, exact parity with shim-era rendering).
- [x] 4.3 Verify: lint + build; manual pass dashboard, courses new/edit/delete, users toggle, requests approve/reject, sales, mobile.
  - `.btn-danger` variant ADDED to `.btn` system (danger `--color-danger` bg, white text, hover `--color-danger-hover`) and wired to the 3 destructive buttons: AdminCourses `Eliminar`, AdminCourseForm `Eliminar lección`, AdminUsers deactivate confirm (`bg-red-500 text-white hover:bg-red-600` → `btn-danger`). Ghost danger texts migrated to `text-danger` token (AdminUsers `Dar de baja/Reactivar`, AdminCourseForm attachment/lesson delete links + `Guardar lección` ghost).
  - Lint: 22 problems (20 errors + 2 warnings) — IDENTICAL pre-existing baseline, zero new. Build PASSED (4.26s, exit 0). Compiled CSS: `[class*=` count 0; new utilities present (`bg-primary-soft`, `text-success`, `btn-danger`, `border-border`, `bg-bg-surface`, `bg-bg-soft`, `text-text-ink`, `focus\:ring-primary`, `file\:bg-primary`); `bg-danger` utility correctly absent (no JSX uses it — `.btn-danger` variant owns destructive styling now).
  - Manual pass checklist (human): see apply-progress PR4 section — approve/reject on `/admin/solicitudes`, course CRUD + lesson add/edit/delete + attachment upload/delete on `/admin/cursos` + `/admin/courses/new` + `/admin/courses/edit/:id`, user toggle/delete on `/admin/usuarios`, stat cards on `/admin`, sales table + filter + bar chart on `/admin/ventas`, nav active state + mobile menu on every admin page.

## Phase 5: hex-sweep (PR 5)

- [ ] 5.1 Sweep all `src/**/*.jsx` arbitrary hex classes (`bg-[#…]`, `text-[#…]`, `hover:bg-[#…]`) → semantic utilities incl. hover variants.
- [ ] 5.2 Delete remaining dead CSS in `index.css`; grep v3 `!`-prefix over `src/` returns zero.
- [ ] 5.3 Verify: lint + build; repeat manual pass on every route, desktop + mobile.

## Non-blocking dependency

- [ ] NOTE: level-badge enum, localhost hardcodes, reset-password, profile persist stay in the separate bugfix change; manual passes note gray badges/broken images.