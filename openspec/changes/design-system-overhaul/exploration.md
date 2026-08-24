# Exploration: Design System Overhaul — design-system-overhaul

## Context

`costura-app/` (React 19 + Vite 8 + Tailwind CSS 4.2 + react-router 7, JSX, Context API) is the only UI in the monorepo; the design system lives entirely in `src/index.css` (920 lines) + `src/fonts-local.css` (105 lines) + `index.html` (Google Fonts). The stylesheet has grown through layered hacks over a rebranding pass (git history: `93d1b14 style(frontend): rebranding with new logo and typography`, `0499b63 feat(landing): aplicar guía de marca — paleta, tipografías, hero y sección visual`), producing THREE parallel color systems and a web of `!important` overrides that fight Tailwind on every page.

No test runner covers visual behavior (vitest exists for unit tests only; `npm run build` and `npm run lint` are the available gates). The change is a pure frontend refactor with no backend impact.

## 1. Inventory of the current design system

### Files

| File | Role |
|------|------|
| `src/index.css` | Everything: `@import "tailwindcss"`, `@import './fonts-local.css'`, `:root` vars, `@theme`, `@layer base` globals, animations, reveal system, hex-mapping hacks, custom helper classes, dead sections |
| `src/fonts-local.css` | Local `@font-face`: Bebas Neue, Dancing Script (400/500/700), Patrick Hand. Montserrat/Playfair blocks commented out (Google Fonts used instead) |
| `index.html` | Google Fonts: Bebas Neue, Playfair Display 400-700, Montserrat 300-700, Dancing Script 400/700 |

### Tokens defined in `:root` (L43-80)

`--bg #FFFFFF`, `--bg-gradient`, `--bg-gradient-inverted`, `--text #1D1D1B`, `--accent #E83E8C`, `--cta #E83E8C`, `--secondary #4E6D5B`, `--secondary-dark #3C5A4B`, `--soft #dddddd` (gray — should be beige), `--surface #FFFFFF`, `--radius 12px`, `--shadow`, `--border`, `--auth-bg #F9F7F2`, `--transition`, fonts (`--font-bebas/playfair/montserrat/dancing/handmade` + semantic `--heading/subtitle/body/accent/handmade-font`), `--black/black-soft/black-dark/black-muted/black-accent`, `--section-card-max-width/shadow/border` (L721-725).

### Tokens REFERENCED but NEVER defined

`--brown`, `--brown-dark`, `--brown-muted`, `--brown-accent`, `--brown-soft` — referenced ~23 times (L320-343 hex maps, L437-438 hover helpers, L525-538 brown utilities, L835-842 nav-on-hero). Every rule using them is invalid at computed-value time, so the property is treated as `unset` (inherited/initial). Practical effect: brown backgrounds render transparent, brown text renders inherited near-black. This is the root cause of the "warm brown palette renders black" bug.

### `@theme` block (L82-91)

`--color-white / rosa #F7C1D6 / fucsia #E83E8C / verde #4E6D5B / black #1D1D1B / border / surface / bg`. **Zero JSX usage** of `bg-rosa`, `text-fucsia`, `text-verde`, etc. — the Tailwind-native token layer is dead in practice.

### Font usage reality

Bebas Neue (headings via base `h1,h2,h3` rule) + Montserrat (body) are the only fonts actually applied. Playfair Display and Dancing Script are loaded from Google Fonts but never used in JSX (`.font-playfair`, `.subtitle`, `.font-dancing`, `.accent-script` are dead CSS).

## 2. Conflict map: global overrides vs. the app

### A. The beige-to-gray system (`[class*="bg-[#...]"]` + `[style*="#..."]` hacks, L300-350)

`--soft: #dddddd` (gray) + hex maps force beige hexes to gray with `!important`:

| Override | Files affected | Intended | Actual |
|----------|---------------|----------|--------|
| `bg-[#F9F5F0]` → `var(--soft)` | App.jsx AdminLayout (L47); AdminCourses (L8,10,22); AdminUsers (L68,73,87,140,144,206); AdminRequests (L57,65,78); AdminSales (L40); AdminCourseForm (L225,229) | Beige admin background | **Gray #dddddd** |
| `bg-[#EAF0EA]`, `bg-[#F5E8E2]`, `bg-[#EDE4D6]` → `var(--soft)` | AdminDashboard stat cards (L38-42); AdminCourses thumbnails (L24); AdminUsers avatars/progress (L123,165); AdminRequests Rechazar button (L88) | Pastel green/peach/cream cards | **Gray** |
| `bg-[#F5EFE6]`, `bg-[#FFF4E5]`, `bg-[#EAF0EA]`, `bg-[#F5E8E2]`, `bg-[#EDE4D6]` | Not currently in JSX (only `border-[#F5EFE6]` in Navbar L160, AdminUsers L182 — not matched by the bg map) | — | Dead maps (landmines) |
| `[style*="#F9F5F0"]` etc. | No live inline beige styles (Home uses rgba gradients; progress bars use `width`) | — | Dead maps (landmines) |

### B. The brown-to-black system (undefined `--brown*` vars)

| Override | Files affected | Intended | Actual |
|----------|---------------|----------|--------|
| `text-[#6B4C3B]` → `var(--brown-muted)` (undefined) | ResetPassword (L20); Profile (L40,48,112); MyCourses (L19,68); Auth (L58,113,123,125); ForgotPassword (L31); Dashboard (L20,43); AdminCourses (L11); AdminUsers (L75,211-214,231,235); AdminSales (L42,67,101,103,118-120,151); AdminRequests (L59,67,81) | Warm brown headings/muted text | **Near-black** (inherited) |
| `text-[#A08060]` → `var(--brown-accent)` (undefined) | AdminUsers (L76,83,97,133,142,148,154,168,177,203,226); AdminDashboard (L88,119); AdminSales (L51,86,111,128,148); AdminRequests (L60,68,74,81,82); Checkout (L119) | Warm brown muted text | **Near-black** |
| `text-brown-accent` class (L527) | Navbar (L98,101,106,120,150,207,220); MyCourses (L102,103); CourseDetail (L200,216,263,299,346,350,361,364); Checkout (L100,140) | Brown accent text | **Near-black** |
| `bg-[#3D2B1F]`, `bg-[#2E1F15]`, `bg-[#4A2E1A]`, `bg-[#5C3D2A]`, `border-[#5C3D2A]` | Not currently in JSX | Brown admin surfaces | Dead maps |
| `text-[#3D2B1F]` → `var(--text)` (defined) | CourseCard (L74); AdminUsers (L94,128,141,145,152,163); AdminSales (L52,53,59,73,85,127,150); AdminRequests (L80); Checkout (L120) | Dark brown ink | Black #1D1D1B (close, still a shift) |

### C. Green-shifted maps (defined vars, wrong shade)

| Override | Files affected | Intended | Actual |
|----------|---------------|----------|--------|
| `text-[#5E8262]`, `text-[#7A9E7E]`, `bg-[#7A9E7E]`, `bg-[#25D366]` → `var(--secondary)` #4E6D5B | AdminUsers toggles/progress (L107,123,166,223,235); AdminRequests Aprobar (L86); AdminSales revenue text (L137); Profile focus rings (L71,81); Home hover borders (L113) | Sage green / WhatsApp green | Brand green #4E6D5B |

### D. Global element rules (`@layer base`, L93-202)

| Rule | Files affected | Intended | Actual |
|------|---------------|----------|--------|
| `h1,h2,h3 { text-transform: uppercase; color: var(--secondary); font-family: Bebas }` | Every page. Sentence-case headings forced uppercase: Home (L70,95,108,119,130,141,151,172), CourseCard titles (L63), CourseDetail h1 (L55,184), Auth (L58), all Profile/MyCourses/Dashboard/Favorites/Admin headers | Mixed-case headings | **ALL CAPS Bebas**; color only rescued where `text-black`/`text-[...]` utilities exist |
| `button:not(.custom-btn)… { background: var(--secondary); color: #fff; padding: 0.75rem 1.125rem }` + hover | EVERY `<button>` without a bg utility gets green+padded: Auth "Ver/Ocultar" (L95); Courses "Limpiar filtros" (L77) and ALL filter pills (L43-47, see E); Navbar profile trigger (L135), notification bell (L71), notification rows (L114), mobile "Cerrar sesión" (L220); CourseDetail lesson accordion headers (L251); AdminUsers Cancel/x modals (L111,136); AdminCourseForm "← Volver" (L231) | Buttons keep their own styling | **Green buttons everywhere**; `.custom-btn` escape hatch exists in CSS but is used by ZERO components |
| `button,… { color: #ffffff !important }` (L387-398) | Kills intended text colors: Auth "Ver" (green text to white), Courses "Limpiar filtros" (#4E6D5B text to white), AdminUsers Cancel hover (never brown), CourseCard disabled state (text-gray-400 to white) | Per-button text color | **White text on all buttons** |
| `.text-white { color: var(--text) !important }` (L402) | Non-button text-white becomes black: Home CTA paragraph (L173); Navbar mobile badge (L210 — black digits on #B84A62); button descendants exempted (L404-422) | White text | **Black text** (except inside buttons) |
| `img, .object-cover { border-radius: 12px; box-shadow; transition }` | CourseCard images (L34); CourseDetail (L52,178); Checkout (L97); Profile (L125); AdminUsers (L161); AdminSales (L132); Navbar/Footer/AdminNavbar logos (object-contain) | Images clean | **Radius+shadow on every image**, incl. small logos (w-9 h-9) |
| `.bg-white, .card, .surface, .panel, .panel-card, .rounded-xl, .rounded-2xl { border-radius: 12px; box-shadow; border: 1px rgba(0,0,0,.06) }` (L122) | Every rounded-xl/2xl element + every bg-white element gets hairline border+shadow: Auth inputs, AdminNavbar buttons, Home cards, CourseDetail cards, Checkout panels; overrides rounded-2xl 16px to 12px | Clean surfaces | **Border+shadow everywhere** |
| `.border { border-color: rgba(0,0,0,0.06) !important }` (L189) | All colored borders grayed: Courses pills `border-[#4E6D5B]/30` (L46); MyCourses `border-[#B84A62]/30` (L96); AdminCourses `border-[#EDE4D6]` (L22); AdminNavbar `border-accent` (L58) | Colored borders | **All borders gray** |
| `footer.bg-black * { color: #fff }` (L449) | Footer (fine) + `border-brown-dark` divider (L40): undefined var makes border take currentColor = **white line** | Dark brown footer divider | White line |
| `.nav-on-hero … { color: var(--brown-dark) !important }` (L835-843) | Home navbar links (Navbar L48) | Brown-dark nav text over hero photo | Undefined var → black text on photo (contrast loss) |
| `section.bg-soft::before` panel system (L731-788) + `section + section` separators | No `<section>` uses bg-soft/bg-secondary → ~90 lines dead; `hero-no-sep` (L813) is live | — | Dead |

### E. Tailwind v3 `!` prefix (dead in v4)

v4 serializes the important modifier as suffix (`text-white!`); the v3 prefix form generates no utility. 10 occurrences across 7 files:

| Class | File | Result |
|-------|------|--------|
| `!bg-[#4E6D5B] !text-white` / `!bg-white !text-[#4E6D5B]` | Courses.jsx filter pills (L45-46) | Dead → global button rule makes ALL pills green; intended active/inactive contrast is gone |
| `!text-white` | CourseCard (L104,115); MyCourses (L30); Favorites (L36); AdminCourses (L14,43) | Dead (white text still works via global button rule, but no `!important` guarantee) |
| `!text-black` | Dashboard (L30) | Dead → link inherits color |

## 3. Component inventory for redesign

All 20 view files use Tailwind utilities + custom helper classes (`text-theme`, `bg-theme`, `bg-soft`, `text-secondary`, `bg-secondary`, `text-accent`, `border-theme`) + arbitrary hexes. The custom helpers are the de-facto design tokens; the `@theme` tokens are unused; inline styles are minimal (hero gradient, progress widths, z-index, text-shadow).

| File | Visual approach | Key hexes | Broken-global dependency |
|------|----------------|-----------|--------------------------|
| `Home.jsx` | Tailwind + hero-card/btn-hero/font-bebas/heading-display/icon-wrapper/reveal-* + inline hero gradient | #E83E8C (SVG props), #7A9E7E/#C4785A hover borders | h1-3 uppercase; bg-soft gray (L67,81); text-white black (L173); rounded-2xl borders; img radius on portrait (L84) |
| `Auth.jsx` | Tailwind only (auth-* CSS classes are dead) | #6B4C3B (broken→black), #4E6D5B rings, #3d5648 hover, #F8F9FA bg | text-[#6B4C3B]→black; "Ver/Ocultar" green button; bg-soft card gray (L66) |
| `Courses.jsx` | Tailwind + animate-stagger | #4E6D5B, #FDF8FA, #F4F1ED (real beige, NOT hacked) | Filter pills all green (dead !-classes); "Limpiar filtros" green button |
| `CourseDetail.jsx` | Tailwind + card/btn-theme/bg-soft/text-theme/text-brown-accent/border-theme | #4E6D5B, #B84A62 (badges via CourseCard), #efe7dd hovers | Accordion headers green (global button); text-brown-accent→black (8x); bg-soft gray (page bg + panels); img radius |
| `Checkout.jsx` | Tailwind + card/btn-theme/bg-soft | #A08060 (broken→black), #3D2B1F (→black) | bg-soft gray (page bg); card borders; text-brown-accent→black (L100,140) |
| `Dashboard.jsx` | Tailwind | #F4F1ED (real beige), #6B4C3B (broken→black), !text-black dead | text-[#6B4C3B]→black |
| `MyCourses.jsx` | Tailwind + stagger-item | #F4F1ED, #6B4C3B (broken), #B84A62, #5E8262 | text-[#6B4C3B]→black; text-brown-accent→black (L102,103); bg-soft gray (L84,96); !text-white dead |
| `Favorites.jsx` | Tailwind | #F4F1ED, #6B4C3B (broken), #5E8262 | Same pattern as MyCourses |
| `Profile.jsx` | Tailwind + bg-soft/border-theme/text-theme | #F4F1ED, #6B4C3B (broken), #7A9E7E rings, #E5EADD | text-[#6B4C3B]→black; bg-soft gray inputs; img radius |
| `ResetPassword.jsx` / `ForgotPassword.jsx` | Tailwind only | #6B4C3B (broken), #4E6D5B, #3D5749/#3d5648 hovers | text-[#6B4C3B]→black |
| `Navbar.jsx` | Tailwind + text-theme/bg-theme/text-brown-accent/nav-on-hero | #B84A62 badges, #A63D57 logout, #F5EFE6 border | nav-on-hero brown-dark→black (home); text-brown-accent→black (7x); green profile trigger/bell/rows; mobile badge black-on-pink |
| `Footer.jsx` | Tailwind + font-bebas/montserrat + bg-black | — | border-brown-dark divider → white; bg-black pure #000 |
| `CourseCard.jsx` | Tailwind + inline levelClasses | #EAF2ED/#FDF3E7/#F9EBF0/#C47D2B/#B84A62 (live, unhacked), #3D2B1F (→black), #4E6D5B, #3d5648 | bg-soft gray (card body); h3 uppercase; img radius/shadow; !text-white dead (L104,115); disabled button white text |
| `AdminNavbar.jsx` | Tailwind + text-theme/bg-theme/text-secondary | #4E6D5B | `border-accent` → gray (L58); `hover:bg-accent/5` dead (no theme color) |
| `AdminDashboard.jsx` | Tailwind + auth-page-bg (LIVE — beige #F9F7F2) | stat card pastels (all →gray), #6B4C3B (broken), #A08060 (broken), #EAF0EA/#F5E8E2/#EDE4D6 | Stat cards gray; headings/muted text black; outer page gray + inner beige mix |
| `AdminCourses.jsx` | Tailwind | #F9F5F0 (→gray), #EDE4D6 (→gray), #6B4C3B (broken), #4E6D5B, #3d5a4a, #bf6b6b | Admin beige → gray; borders gray; !text-white dead |
| `AdminUsers.jsx` | Tailwind | #F9F5F0 (→gray), #E5EADD/#E5E0D8, #A08060 (broken), #6B4C3B (broken), #3D2B1F (→black), #7A9E7E/#5E8262, #EDE4D6 | Heaviest hex user; beige→gray everywhere; muted text black; Cancel/x green buttons |
| `AdminSales.jsx` | Tailwind | #F9F5F0 (→gray), #6B4C3B (broken), #A08060 (broken), #3D2B1F (→black), #5E8262 | Beige→gray; all text shifted to black |
| `AdminRequests.jsx` | Tailwind | #F9F5F0 (→gray), #6B4C3B (broken), #A08060 (broken), #7A9E7E/#5E8262, #EDE4D6 | Beige→gray; Aprobar/Rechazar colors shifted |
| `AdminCourseForm.jsx` | Tailwind | #F9F5F0 (→gray), #EDE4D6 border, #4E6D5B, #3e5849 (4th dark-green variant), #bf6b6b | Beige→gray; "← Volver" green button; file-input hovers |

**Hex normalization data points**: 4 dark-green hover variants (`#3d5648`, `#3D5A4A`, `#3D5749`, `#3e5849`); 2 beige families (hacked `#F9F5F0`/`#F5EFE6`/`#EDE4D6`/`#EAF0EA`/`#F5E8E2`/`#FFF4E5` vs. unhacked `#F4F1ED`, `#F8F9FA`, `#FDF8FA`, `#E5EADD`, `#E5E0D8`, `#EAF2ED`, `#FDF3E7`, `#F9EBF0`); 3 brown ink tones (`#6B4C3B`, `#3D2B1F`, `#A08060`); 2 reds for delete/errors (`#bf6b6b`, `#bf5b6b`) + `#A63D57` logout, `#B84A62` berry (badges/hearts), `#A85E42` terracotta, `#C47D2B` amber, `#C4785A` hover, `#A36700` stat card.

**Most visually dependent on the broken hacks**: the 6 admin pages (beige-to-gray + brown-to-black is their entire identity), followed by Auth/Profile/MyCourses/Favorites/Dashboard (brown headings → black), then Home (uppercase + gray sections + text-white).

## 4. Design directions (product-level)

Brand facts: Grow Creative Education Studio — online sewing/embroidery/textile-design education for Spanish-speaking women, run by Daiana ("Daia") Lubo; audiences in Argentina (ARS) and Australia (AUD); Instagram-driven; copy in warm voseo. Existing brand DNA: warm browns + beiges, sage green CTA, fucsia accent, Bebas Neue display + Playfair serif + Dancing Script flourishes + Montserrat body, soft rounded cards, handcrafted feel.

### Direction A — "Warm Editorial" (RECOMMENDED)

- **Core palette**: `cream #F9F5F0` (page/section surfaces), `paper #FFFFFF` (cards), `cocoa #6B4C3B` (headings/ink), `espresso #3D2B1F` (strong text), `sage #4E6D5B` (primary action), `berry #B84A62` (secondary accent), `blush #F7C1D6` (soft tints).
- **Typography**: Bebas Neue for display headings, Playfair Display italic for subheadings/accents, Montserrat for body and UI. Dancing Script reserved for small flourishes.
- **Buttons/cards/forms**: sage solid buttons (rounded-xl), cream cards with hairline borders and soft shadows, inputs with sage focus rings, sentence-case headings.
- **Brand fit**: restores the palette the rebrand commits intended (beige sections, brown ink, serif accents). Closest to the "guía de marca" in git history; warm, editorial, handcrafted — matches the studio positioning and the Instagram audience.

### Direction B — "Modern Craft Studio"

- **Core palette**: `white #FFFFFF` surfaces, `sand #F5F1EA` sections, `sage #4E6D5B` primary, `fucsia #E83E8C` accent (single), `charcoal #1D1D1B` text, `clay #C4785A` tertiary.
- **Typography**: Bebas Neue display, Montserrat body (drop Playfair/Dancing from the UI; keep only in brand assets).
- **Buttons/cards/forms**: pill buttons, white cards with soft shadows and NO borders, generous spacing.
- **Brand fit**: cleaner and more modern, but loses the warm brown editorial identity; fucsia becomes the only personality color. Higher contrast, easier to maintain, but a bigger departure.

### Direction C — "Elegant Feminine"

- **Core palette**: `blush #F9EBF0` / `rose #F7C1D6` backgrounds, `berry #B84A62` primary, `cocoa #6B4C3B` text, `cream #F5EFE6` cards, `gold #C4A882` accents.
- **Typography**: Playfair Display for headings (replaces Bebas), Montserrat body, Dancing Script flourishes.
- **Buttons/cards/forms**: berry rounded buttons, blush-tinted cards, decorative serif headings.
- **Brand fit**: elegant and feminine, but the berry-led palette would recolor every CTA and the green system disappears; Playfair headings change the entire typographic voice. Largest visual change of the three.

### Recommendation

**Direction A — "Warm Editorial"**. It is the only direction that (1) matches the original brand guide the rebrand commits intended, (2) reuses the existing dominant hues (#6B4C3B, #F9F5F0, #4E6D5B, #B84A62) so the migration is mostly re-mapping broken tokens instead of inventing new ones, and (3) keeps the green CTA + fucsia accent system that already carries the app. It restores beige and brown where the hacks turned them gray/black, keeps Bebas (already the de-facto heading font) and finally puts Playfair to use for the serif accent the brand promised. Direction B is the fallback if the team prefers a cleaner surface aesthetic.

## 5. Target architecture (Tailwind v4)

### Token layer — single source of truth in `@theme`

Define EVERYTHING as `@theme` tokens so Tailwind generates real utilities (replacing the custom helper classes and the `:root` + `@theme` split):

- **Colors (semantic)**: `--color-bg-surface` (#FFFFFF), `--color-bg-soft` (#F9F5F0 cream), `--color-bg-tint` (#F7C1D6 blush), `--color-text-primary` (#1D1D1B), `--color-text-ink` (#6B4C3B cocoa), `--color-text-muted` (#A08060), `--color-primary` (#4E6D5B sage), `--color-primary-dark` (#3C5A4B), `--color-accent` (#E83E8C fucsia), `--color-accent-soft` (#B84A62 berry), `--color-border-default` (rgba(29,29,27,0.06)), `--color-danger` (#bf6b6b).
- **Fonts**: `--font-display` (Bebas Neue), `--font-serif` (Playfair Display), `--font-sans` (Montserrat), `--font-script` (Dancing Script), `--font-handmade` (Patrick Hand).
- **Radii/shadows**: `--radius-card`, `--radius-pill`, `--shadow-card`, `--shadow-soft`.
- **Animations**: move keyframes into `--animate-*` tokens (`fade-up`, `fade-in`, `slide-down`, `slide-up-fade`) and use `animate-fade-up` utilities.
- **Keep** the `:root` block ONLY for the few runtime-var consumers (`.text-accent` hero span via `var(--accent)`) or migrate those to utilities.

Also: DEFINE the five missing `--brown*` vars during migration as an interim step so the hex maps stop being no-ops, then delete the maps.

### Removal strategy for global overrides

1. **Delete the hex-mapping hacks** (L300-350 `[class*=]` + `[style*=]`) — replace with token utilities in JSX (the maps exist only because components use raw hexes).
2. **Delete the global element rules**: `h1,h2,h3` (uppercase/Bebas/color), `button:not(.custom-btn)` (green paint), the `button { color: #fff !important }` block, `.text-white` override + carve-outs, `img/.object-cover` radius+shadow, `.bg-white/.card/.rounded-xl/.rounded-2xl` border+shadow, `.border` color override, `footer.bg-black *` (move to a `bg-black` + `text-white` utility combo on the footer element), `section.bg-*` panel system.
3. **Replace custom helper classes** (`text-theme`, `bg-theme`, `bg-soft`, `bg-secondary`, `text-secondary`, `text-accent`, `border-theme`, `.card`, `.btn-theme`) with generated utilities (`text-text-primary`, `bg-bg-soft`, `bg-primary`, `text-primary`, `text-accent`, `border-border-default`, `rounded-card`) — or keep a tiny `@utility` layer for the 2-3 that carry animation state.
4. **Delete dead CSS (~380-400 of 920 lines)**: auth-* block (except `auth-page-bg` currently used by AdminDashboard — migrate to utility), filter-container/filter-btn, visual-*, logo-circle, section-centered-card, btn-ghost/icon-btn/btn-eye/input-default/btn-primary, lvl-*, bg-beige, fill-brown-accent, accent-script, subtitle/body-text/title, text-brown-soft/muted, border-brown-accent, hover:text-rosa, font-dancing/font-handmade helpers (keep @font-face).
5. **Fix Tailwind v3 syntax**: convert `!text-white` → `text-white!` (or drop it — the global button rule dies, so explicit `text-white!` is needed on button labels that must stay white), `!bg-[#4E6D5B]` → `bg-primary`.

### Migration order

1. **Token foundation** — rewrite `@theme` with semantic tokens; add interim `--brown*` definitions; no component changes; visual output must be byte-identical (verify by screenshot diff of the few pages).
2. **Global reset** — delete override blocks + dead CSS; fix the components that depended on them (buttons, headings, images, borders, text-white). This is the risky PR.
3. **Component sweep (public)** — Home, Auth, Courses, CourseDetail, Checkout, Dashboard, MyCourses, Favorites, Profile, Reset/ForgotPassword, Navbar, Footer, CourseCard: replace hexes with tokens, normalize the 4 green hovers and beige families.
4. **Component sweep (admin)** — the 6 admin pages + AdminNavbar: restore beige backgrounds, brown ink, stat-card pastels.

## 6. PR split proposal (chained, 400-line budget)

| PR | Scope | Est. lines | Risk |
|----|-------|-----------|------|
| PR1 "design-tokens" | `@theme` semantic tokens + `--brown*` definitions + dead CSS removal (~380 lines) | ~250 | Low — visual parity expected |
| PR2 "global-reset-public" | Remove global overrides; fix Home/Auth/Courses/CourseDetail/Checkout + Navbar/Footer/CourseCard | ~350 | High — every page shifts |
| PR3 "global-reset-admin" | Remove remaining overrides; fix 6 admin pages + AdminNavbar + Dashboard/MyCourses/Favorites/Profile (student pages share admin tokens) | ~300 | High |
| PR4 "hex-sweep" | Replace remaining arbitrary hexes with tokens across all files (incl. the 4 dark-green hovers) | ~150 | Medium |

PR1 must land alone (it changes global CSS but with visual parity). PR2/PR3 split the reset so the admin beige restoration is reviewed separately from the public pages. PR4 is a mechanical find-replace pass. Each PR verifies with `npm run lint` + `npm run build` + a manual pass over its page list.

## 7. Risks

- **Visual regressions during the reset**: deleting the global button rule changes EVERY unstyled button (Auth "Ver", Navbar bell/profile, Courses pills, accordion headers, modal Cancel/x). Mitigation: per-page manual pass list, PR2/PR3 split, and the existing unit tests only cover logic (no visual tests).
- **Admin flows**: admin pages are the most hack-dependent (beige-to-gray, brown-to-black, stat-card pastels). A regression here blocks course/purchase management. Mitigation: restore admin in its own PR with a full click-through of approve/reject, course CRUD, and user toggles.
- **Inline styles**: minimal today (verified: only gradients, widths, z-index, text-shadow) so the `[style*=]` hacks are currently inert — but removing them while an inline beige style exists later would silently break. Keep the removal and the JSX sweep in the same change.
- **Heading uppercase**: changing `h1,h2,h3` behavior flips ALL headings to sentence case. Intended for most, but some copy (e.g. Home "Nuestras especialidades") may have been written assuming uppercase. Needs a copy-level pass, not just CSS.
- **`text-white` semantics**: the current global makes `text-white` mean black; after the reset it means white again. Any element relying on the old behavior (Home CTA paragraph, Navbar mobile badge) must be checked.
- **No visual test harness**: `npm run build` catches CSS syntax and utility-generation issues but NOT visual intent. Rollback = revert the PR (CSS/JSX only, no DB migration); keep each PR independently revertable.
- **Font loading**: Playfair/Dancing already load via Google Fonts; if the redesign applies them, verify no FOIT regression and that the local @font-face files for Bebas/Dancing/Patrick Hand keep working.

## Ready for Proposal

Yes. The exploration is complete: full token inventory (5 undefined vars), 12 override families mapped to files/lines, per-component dependency table, 3 design directions with a recommendation (Warm Editorial), a Tailwind v4 semantic-token target architecture, and a 4-PR chained delivery plan. The orchestrator should tell the user: the design system has drifted into a gray/black rendition of the intended warm beige/brown brand; the fix is a token-first rebuild of `index.css` + a page-by-page sweep, delivered as chained PRs starting with a visual-parity token PR.