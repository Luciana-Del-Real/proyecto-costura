# Design: Design System Overhaul

## Technical Approach

Replace `src/index.css`'s parallel systems with one Tailwind v4 `@theme`; migrate JSX to semantic utilities, then remove overrides. Stage A preserves warm intent; Stage B redesigns public course surfaces before admin. React Context, routes, JSX, and local fonts remain unchanged.

## Architecture Decisions

| Decision | Choice | Alternative rejected / rationale |
|---|---|---|
| Tokens | Semantic `@theme` names, not raw hex in JSX | Avoids duplication and makes palette changes auditable. |
| Sequence | Parity, then editorial redesign | Separates reset regressions from visual evolution. |
| Admin | Last, isolated PR | Admin is most dependent on hacks; rollback stays safe. |
| Styling | Tailwind utilities plus small CSS helpers | Avoids runtime and migration scope of CSS-in-JS/library. |

## Token Contract

The single `@theme` defines: `--color-bg-surface:#F9F5F0`, `--color-bg-soft:#F5EDE4`, `--color-bg-cream:#F9F5F0`, `--color-text-ink:#6B4C3B`, `--color-text-cocoa:#6B4C3B`, `--color-text-muted:#8F7666`, `--color-primary:#4E6D5B`, `--color-primary-hover:#3D5648`, `--color-primary-soft:#EAF0EA`, `--color-accent:#B84A62`, `--color-accent-hover:#A63D57`, `--color-accent-soft:#F9EBF0`, `--color-border:#E5D8CB`, `--color-danger:#BF6B6B`, `--color-danger-hover:#BF5B6B`, `--color-success:#5E8262`, `--color-success-hover:#4E6D5B`; fonts `--font-display:Bebas Neue`, `--font-serif:Playfair Display`, `--font-body:Montserrat`; radii `--radius-sm:.5rem`, `--radius-md:.75rem`, `--radius-lg:1rem`, `--radius-pill:9999px`; shadows `--shadow-soft:0 4px 15px rgba(107,76,59,.08)`, `--shadow-card:0 12px 30px rgba(78,109,91,.08)`. Keep local `@font-face` registrations.

Undefined variable migration: `--brown` → `--color-text-ink`; `--brown-dark` → `--color-text-cocoa`; `--brown-muted` → `--color-text-muted`; `--brown-accent` → `--color-accent`; `--brown-soft` → `--color-bg-soft`. Replace references; retain no aliases. Delete `:root` vars (43–80), including black palette, and unused `@theme` `rosa/fucsia/verde` (82–91). Retain/add `--animate-*` tokens.

## Reset Strategy

| Lines | Family and replacement | Blast radius |
|---|---|---|
| 105–112 | Remove global heading font/color/uppercase; use `font-display`/`font-serif` per heading | Every page |
| 114–118 | Remove global image/object-cover radius/shadow; utilities only | All images |
| 120–128 | Remove global card/bg-white/rounded styling; explicit card classes/utilities | Cards, panels, course detail |
| 130–178 | Remove global button base/hover; explicit utilities/components | All buttons, links, filters |
| 186–189 | Remove `.mb-6` and `.border !important`; utilities win | Layout and borders |
| 300–316 | Delete class hex background/border maps | Public/admin surfaces |
| 318–345 | Delete text/green/brown hex maps | Text, badges, admin |
| 346–350 | Delete inline-style maps; migrate inline colors to tokens/classes | Home/admin inline styles |
| 352–379 | Replace `.card`, `.btn-*`, theme helpers with generated utilities | JSX helper users |
| 381–422 | Delete forced button/text-white rules; preserve intentional `text-white` locally | CTAs, navbar, footer |
| 424–452 | Delete `!important` semantic/black/footer helpers; use `bg-*`, `text-*`, `border-*` utilities | Footer and legacy helpers |
| 721–800 | Delete section pseudo-panel and beige→gray behavior; explicit section surfaces | Home sections/admin |

## Delivery / File Changes

| PR | Files and design work | Verification / risk |
|---|---|---|
| design-tokens | `src/index.css`, `fonts-local.css`; token layer, brown resolution, dead CSS | Lint/build; click `/`, `/cursos`, auth, dashboard, `/admin`; visual parity. |
| button-system | `src/index.css` (`.btn` layer, rule removal), all `src/**/*.jsx` buttons, auth/navbar/courses/detail/checkout/profile/admin | Lint/build; click every route, confirm all buttons share 44px height + 12px radius; disabled states. Shape-consistency sweep only, no layout redesign. |
| global-reset-public | Public pages plus `Navbar`, `Footer`, `CourseCard` | Lint/build; click auth, catalog filters/search, lesson/comment, checkout, dashboard/profile/favorites, mobile. High risk: controls and `text-white`. |
| global-reset-admin | `App.jsx`, `AdminNavbar`, all six `pages/admin/*`; admin surfaces, stats, CRUD states | Lint/build; click dashboard, courses new/edit/delete, users toggle, requests approve/reject, sales, mobile. High risk: hack-dependent beige UI. |
| hex-sweep | all `src/**/*.jsx`, remaining CSS; arbitrary colors → semantic utilities, including hover variants | Lint/build and repeat every route; mechanical medium risk. |

## Tailwind v4 Important Syntax

The source audit finds **11 utility occurrences in six files** (not the stated ten/seven): `Courses.jsx` L45 (`!bg-[#4E6D5B]`→`bg-primary`, `!text-white`→`text-white`) and L46 (`!bg-white`→`bg-bg-surface`, `!text-[#4E6D5B]`→`text-primary`); `CourseCard.jsx` L104/L115, `AdminCourses.jsx` L14/L43, `MyCourses.jsx` L30, `Favorites.jsx` L36 (`!text-white`→`text-white`); `Dashboard.jsx` L30 (`!text-black`→`text-text-ink`). Use suffix `!` only if precedence remains necessary.

## Stage B Treatment

Home gets a cream canvas, cocoa-overlay image hero, Bebas title, Playfair accent, sage CTA, and berry accent; headings become sentence case except brand displays. Course cards use cream surface, cocoa title, muted copy, soft level badges, sage action, berry favorite, and restrained shadow. Catalog, detail, checkout, then authenticated pages follow. Admin receives the same treatment in PR3.

## Button System (PR2, user directive: same shape for all buttons)

Canonical geometry defined ONCE in `@layer components` in `src/index.css`, applied via explicit classes only. No global `button` rule remains; `button:not(.custom-btn)` machinery, `.btn-eye`, `.btn-theme`, the forced-white block, `.auth-card button` radius override, `.nav-on-hero .btn`, and the `.filter-container`/`.filter-btn` block are removed. Filters migrate to the same `btn` classes.

| Class | Geometry | Color treatment |
|---|---|---|
| `.btn` (base) | inline-flex centered, gap .5rem, height 44px (2.75rem), padding 0 1.5rem, border-radius 12px, font-medium, line-height 1, cursor pointer, transition, border 1px transparent; `:focus-visible` ring (`--color-ring`); `:disabled` opacity + no pointer | none (variant adds color) |
| `.btn-primary` | base | sage `--color-primary` bg, white text, hover `--color-primary-hover` |
| `.btn-accent` | base | berry `--color-accent` bg, white text, hover `--color-accent-hover` |
| `.btn-ghost` | base | transparent bg, 1px `--color-border` border, ink text, hover `--color-bg-soft` |
| `.btn-icon` | base, square 44px (width 2.75rem, padding 0) | transparent bg, ink text, hover `--color-bg-soft` |
| `.btn-hero` | base + min-width 150px, larger font | kept as deliberate size modifier on top of `.btn btn-primary` (same radius) |

New token added to `@theme`: `--color-ring` for the `:focus-visible` ring.

Migration rule: every `<button>` / `<a role="button">` / input[type=submit] gets `btn` + one variant (`btn-primary` sage CTAs, `btn-accent` berry actions, `btn-ghost` text/link-like, `btn-icon` icon-only). Remove redundant Tailwind shape classes (`py-*`, `rounded-*`, `bg-[hex]`, `text-white`, `h-*`) that the `.btn` geometry now provides; keep color-specific utilities only where a variant does not fit (e.g. `bg-danger` for destructive admin actions) and note them.

## Testing, Risks & Rollback

Vitest exists but has no visual harness; use focused tests plus `npm run lint` and `npm run build` at every PR. Manual passes cover the routes above, desktop/mobile, and loading/empty/error states. Each PR is CSS/JSX-only: `git revert <PR>` independently and rerun build. Risks are global button removal, heading case, `text-white` inversion, missing fonts, and deliberately out-of-scope gray badges/broken images.

## Interfaces / Contracts

Pages consume only generated classes (`bg-bg-surface`, `bg-bg-soft`, `text-text-ink`, `text-primary`, `text-accent`, `border-border`) and may use explicit local component styling. No new runtime interface or route is introduced.

## Threat Matrix

N/A — no routing, shell, subprocess, VCS/PR automation, executable-file classification, or process-integration boundary is changed.

## Migration / Rollout

No data migration or feature flag. Merge four chained PRs in order; each is independently revertible. Functional defects remain separate.

## Open Questions

- [ ] Confirm whether any non-brand heading must remain uppercase and verify Playfair/Dancing local font loading/FOIT during PR1.
