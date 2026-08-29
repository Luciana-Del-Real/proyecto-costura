# design-system Specification

## Purpose

Owns the visual layer of `costura-app/`: one semantic `@theme` token layer, override/dead-CSS removal, and Warm Editorial presentation. Functional specs are unchanged.

## Requirements

### Requirement: Single semantic token layer

System MUST define all design tokens in ONE `@theme` block in `costura-app/src/index.css`, replacing the three parallel color systems (`:root`, dead `@theme`, hex maps). Tokens MUST cover semantic colors (bg-surface, bg-soft, text-ink, text-muted, primary, accent, border, danger/success), fonts (Bebas display, Playfair serif, Montserrat body), radii, shadows.

- **Utilities generate** — GIVEN `@theme` defines semantic tokens, WHEN Tailwind builds, THEN token utilities (bg-bg-soft, text-text-ink) are used by pages.
- **Brown references resolve** — GIVEN a `var(--brown*)` reference, WHEN scanned, THEN it resolves to a defined token or is removed; no undefined property MAY remain.

### Requirement: Override removal

System MUST remove `!important` overrides and `[class*=hex]`/`[style*=...]` hacks, and MUST NOT flatten beige to gray. Global `button`/`img`/heading/`.rounded-*`/`.border`/`.text-white` rules MUST stop overriding Tailwind utilities, which MUST win unless a semantic component style applies.

- **Beige stays beige** — GIVEN admin surfaces use beige hexes, WHEN rendered, THEN they show beige (#F9F5F0), not gray #dddddd.
- **Utilities win** — GIVEN an element has a Tailwind utility, WHEN rendered, THEN the utility applies; no override remains.

### Requirement: Tailwind v4 important syntax

System MUST migrate all v3 `!`-prefix classes to v4 suffix syntax or remove them; no inert `!`-prefix MAY remain.

- **Prefix migrated** — GIVEN `!text-white` / `!bg-[#4E6D5B]` in JSX, WHEN migrated, THEN they become `text-white!` / `bg-primary` or are removed.
- **Zero prefix left** — GIVEN a grep over `src/`, WHEN searching v3 `!`-prefix classes, THEN zero matches remain.

### Requirement: Dead CSS removal

System MUST remove unused helpers and ~350-400 dead lines; no JSX MAY reference a removed class.

- **Dead lines gone** — GIVEN `index.css` is ~920 lines, WHEN the change completes, THEN it is ~540 lines and the build passes.
- **No dangling class** — GIVEN a removed class, WHEN JSX is scanned, THEN no JSX references it; referencing JSX migrates to token utilities.

### Requirement: Visual parity after token rebuild (Stage A)

PR1 MUST ship with visual parity: pages MUST render the intended warm palette (beige surfaces, cocoa ink, sage CTAs, berry accents), fixing only the gray/black bugs.

- **Parity pass** — GIVEN PR1 lands, WHEN the manual page pass runs, THEN pages match the pre-change warm intent.
- **Regression blocked** — GIVEN an unintended visual change, WHEN PR1 is reviewed, THEN it is fixed or reverted.

### Requirement: Warm Editorial redesign (Stage B)

System MUST apply Warm Editorial page-by-page — public surfaces first (Home, catalog, course detail, checkout), admin last — with Bebas/Playfair headings, Montserrat body, sentence-case headings, and consistent buttons/cards.

- **Public first** — GIVEN Stage B starts, WHEN surfaces are redesigned, THEN public surfaces land before admin surfaces.
- **Brand preserved** — GIVEN a redesigned page, WHEN compared with the brand guide, THEN beige/brown/sage/berry remain and headings are sentence-case except brand displays.

### Requirement: Chained delivery with per-PR gates

System MUST ship as four chained PRs (design-tokens → global-reset-public → global-reset-admin → hex-sweep); each MUST pass `npm run lint` + `npm run build` + a documented manual pass and MUST be independently revertible with no DB impact.

- **PR gated** — GIVEN a chained PR, WHEN merged, THEN lint, build, and the manual pass succeed.
- **Revert-safe** — GIVEN one PR is reverted, THEN earlier PRs stay valid (CSS/JSX only, no data impact).

### Requirement: Out-of-scope functional bugs

System MUST NOT fix out-of-scope functional bugs (level-badge enum, localhost hardcodes, reset-password, profile persist); they MUST be tracked as a non-blocking dependency on the separate bugfix change.

- **Scope respected** — GIVEN an out-of-scope bug, WHEN this change ships, THEN it remains in the bugfix change.
- **Non-blocking** — GIVEN the bugfix change has not landed, WHEN design PRs ship, THEN they proceed; manual passes note gray badges/broken images.

### Requirement: Button geometry system (PR2)

User directive: "make the shape of all buttons the same". System MUST define ONE canonical button geometry via explicit `.btn` classes (base + variants), styled ONLY by explicit classes; the global `button:not(.custom-btn)` rule and the legacy `.btn-*`/`.custom-btn`/forced-white machinery MUST be removed so no hidden rule fights Tailwind utilities.

- **Canonical geometry** — GIVEN any actionable button (button, a.btn, input[type=submit], role=button) is rendered, WHEN it carries the `btn` class, THEN it shares the canonical geometry: height 44px, padding 0 1.5rem, border-radius 12px, font-medium, inline-flex centered with gap, transition, focus-visible ring, and a disabled state (opacity + no pointer).
- **Variants share geometry** — GIVEN `.btn-primary`, `.btn-accent`, `.btn-ghost`, or `.btn-icon` is applied, WHEN rendered, THEN each shares the exact canonical geometry and differs only in color treatment.
- **Explicit only** — GIVEN a `<button>` element, WHEN rendered, THEN it is styled by its `btn` classes or a documented exception; no global button rule applies.
- **Disabled state** — GIVEN a disabled button with the `btn` class, WHEN rendered, THEN it shows reduced opacity and no pointer events.

### Requirement: Button text policy (PR3 amendment)

System MUST follow the settled button-text policy: filled/action buttons render white text by default (from the `.btn` base + `.btn-primary`/`.btn-accent`), ghost/icon buttons MAY use readable semantic colors (ink/sage/berry/red), and NO button MAY use a white background to differentiate state (state differentiation uses ghost border + primary fill instead).

- **Filled white text** — GIVEN a `.btn-primary` or `.btn-accent` button, WHEN rendered, THEN its text is white (default from the `.btn` base); no per-button `text-white` override is needed.
- **Ghost semantic text** — GIVEN a `.btn-ghost` or `.btn-icon` button, WHEN rendered, THEN it MAY carry semantic text colors (ink/sage/berry/red) for readable emphasis.
- **No white-bg states** — GIVEN a button needing a distinct state, WHEN a state is applied, THEN white background is never used to differentiate it; the state uses ghost border + primary fill (or a documented variant).

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
