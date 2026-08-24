# Proposal: Design System Overhaul — design-system-overhaul

## Intent

`costura-app/src/index.css` (920 lines) renders a gray/black version of the intended warm beige/brown brand. Causes: `!important` override blocks fight Tailwind page-wide; five `--brown*` tokens are referenced ~23x but never defined (brown bg -> transparent, brown text -> inherited near-black); three parallel color systems (`:root` + dead `@theme` + hex-map hacks); ~42% dead CSS; Tailwind v3 `!` prefix (10x across 7 files) inert in v4. This change rebuilds one semantic `@theme` token layer with VISUAL PARITY first, then applies a bold Warm Editorial redesign page-by-page, delivered as chained PRs.

## Scope

### In Scope
- Rebuild `@theme`: semantic colors/fonts/radii/shadows/state + `--animate-*`; define 5 missing `--brown*` as interim step, then delete the hex maps.
- Remove global override blocks + ~350-400 lines dead CSS (hex hacks, `h1-h3` uppercase/Bebas, `button:not(.custom-btn)` green paint, `button { color:#fff !important }`, `.text-white` override, `img` radius+shadow, `.bg-white/.card/.rounded-*` border+shadow, `.border` color override, `footer.bg-black *`, `section.bg-*` panel system).
- Fix Tailwind v3 `!` prefix -> v4 suffix (`!text-white` -> `text-white!`, `!bg-[#4E6D5B]` -> `bg-primary`).
- Migrate custom helper classes (`text-theme`, `bg-soft`, `text-accent`, `border-theme`, `.card`, `.btn-theme`) to generated utilities.
- Page-by-page Warm Editorial redesign: cream #F9F5F0 surfaces, cocoa #6B4C3B ink, sage #4E6D5B CTAs, berry #B84A62 accent, Bebas display + Playfair serif accents + Montserrat body, sentence-case headings.
- Chained delivery in 4 PRs (design-tokens -> global-reset-public -> global-reset-admin -> hex-sweep); per-PR verification = lint + build + manual page pass.

### Out of Scope
- Functional bugs (level-badge enum mismatch, `localhost:3000` hardcodes, dead reset-password flow, profile persist) -> separate SDD change (non-blocking dependency).
- Backend / DB / Prisma changes.
- Content/copy overhaul beyond heading-case fixes.
- New pages or features.

## Capabilities

> Contract between proposal and specs. Existing specs (auth-admin-security, profile-purchase-history, mail-service, favorites-notifications-integration, data-schema-migrations, access-control-ownership) are all functional domains; none cover the visual layer.

### New Capabilities
- `design-system`: semantic token layer (colors/fonts/radii/shadows/state), visual-parity contract, and Warm Editorial presentation rules for all surfaces.

### Modified Capabilities
- None. Functional requirements of existing specs are unchanged; only their visual rendering changes, owned by the new `design-system` spec.

## Approach

Single `@theme` source of truth -> delete override blocks -> fix `!` syntax -> migrate helpers -> hex sweep. Identity is open to evolution: Warm Editorial is the base; the token layer MAY adjust identity; validate visually per PR. Order by token dependency: public surfaces first (Home, catalog, course detail, checkout), admin last (most hack-dependent, restored in its own PR with full click-through).

| PR | Scope | Est. lines | Risk |
|----|-------|-----------|------|
| PR1 design-tokens | `@theme` semantic tokens + interim `--brown*` + dead CSS removal (~380 lines) | ~250 | Low (visual parity expected) |
| PR2 global-reset-public | Remove overrides; fix Home/Auth/Courses/CourseDetail/Checkout + Navbar/Footer/CourseCard | ~350 | High (every page shifts) |
| PR3 global-reset-admin | Fix 6 admin pages + AdminNavbar + Dashboard/MyCourses/Favorites/Profile; restore beige, brown ink, stat pastels | ~300 | High (admin flows) |
| PR4 hex-sweep | Replace arbitrary hexes with tokens across all files (incl. 4 dark-green hover variants) | ~150 | Medium |

PR1 lands alone (global CSS, visual parity). PR2/PR3 split the reset so admin beige restoration is reviewed separately. PR4 is mechanical find-replace. Each PR closes with `npm run lint` + `npm run build` + documented manual page pass.

## Business Context

Grow Creative Education Studio: online sewing/embroidery/textile-design education for Spanish-speaking women (Argentina ARS / Australia AUD), Instagram-driven, warm voseo copy. The redesign MUST keep the brand recognizable (warm browns + beiges, sage CTA, berry accent, Bebas/Playfair/Montserrat) while modernizing surfaces.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `costura-app/src/index.css` | Modified | Token rebuild + override/dead-CSS removal (~920 -> ~540 lines) |
| `costura-app/src/fonts-local.css` | Modified | Keep `@font-face`; drop dead font helper classes |
| `costura-app/src/pages/*` (Home, Auth, Courses, CourseDetail, Checkout, Dashboard, MyCourses, Favorites, Profile, ResetPassword, ForgotPassword) + 6 admin pages | Modified | Token utilities, sentence-case headings, Warm Editorial redesign |
| `costura-app/src/components/*` (Navbar, Footer, CourseCard, AdminNavbar) | Modified | Token utilities + redesign |
| `backend/` (costura-api) / DB / Prisma | None | Untouched |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Global button-rule removal affects every unstyled button (Auth "Ver", Navbar bell/profile, Courses pills, accordion headers, modal Cancel/x) | High | Per-page manual pass list; PR2/PR3 split |
| Admin click-through regression (most hack-dependent surface: beige-to-gray + brown-to-black) | High | Admin restored in own PR (PR3) with full approve/reject + course CRUD + user-toggle click-through |
| Heading uppercase -> sentence-case flip needs copy pass | Medium | Heading-case fixes in scope; flag any brand displays needing preserved uppercase during PR2 |
| `text-white` semantics invert (was black -> now white): Home CTA paragraph, Navbar mobile badge | Medium | Audit affected elements per PR2 |
| No visual test harness (build catches syntax/util-gen, not visual intent) | High | Manual page pass per PR; keep PRs independently revertable |
| Manual passes see gray badges / broken images until bugfix change lands | Low | Listed as non-blocking dependency |

## Rollback Plan

Each PR is CSS/JSX only: no DB migration, no backend change, no persisted data impact. To revert: revert the PR branch and re-run `npm run build`. PRs are independent: PR1 (tokens) stands alone; PR2/PR3/PR4 revert independently without unwinding earlier PRs. No data loss path exists.

## Dependencies

- Non-blocking: separate SDD change for functional bugs (level-badge enum mismatch, `localhost:3000` hardcodes, dead reset-password flow, profile persist). Design PRs proceed; manual passes will show gray badges / broken images until that change lands.

## Open Questions

- Which headings (if any) MUST stay uppercase after the sentence-case flip (e.g. brand displays)? Default: all headings sentence-case unless flagged during the PR2 copy pass.
- Confirm Playfair/Dancing local `@font-face` loading (FOIT behavior) is acceptable once the redesign applies them; verify on PR1.

## Success Criteria

- [ ] Single `@theme` semantic token layer; zero undefined `--brown*` references; zero hex-mapping hacks.
- [ ] PR1 ships with visual parity (no unintended change) verified by manual page pass.
- [ ] All global override blocks and ~350-400 lines dead CSS removed.
- [ ] Zero Tailwind v3 `!` prefix syntax remaining.
- [ ] Warm Editorial redesign applied across public surfaces then admin; brand remains recognizable.
- [ ] Every chained PR passes `npm run lint` + `npm run build` + documented manual page pass; each independently revertable.
