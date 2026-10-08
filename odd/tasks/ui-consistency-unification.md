# UI consistency unification

## Objective

Find every UI pattern that **serves the same function but is implemented differently** and unify it behind one shared component per function, so the app looks and behaves consistently everywhere (loading, empty, error, search, back links, badges, success banners, modals) and no route ever looks blank while loading.

## Problem (audit evidence)

| Function | Distinct implementations | Notes |
| --- | --- | --- |
| Loading | ~22 | 11 emoji (🧵 / 🎉) + 11 inline text loaders in 4 styles |
| Empty states | ~20 | 3 families: `card-flat` card, centered `py-20` block, bare `<p>` |
| Error states | ~12 | 3 families: icon+heading, red banner, inline `<p>` |
| Modals | 4 hand-rolled | inconsistent z-index (50/70/80/100) and overlay opacity (30/40) |
| Search input | 9 identical | the exact class string is copy-pasted |
| Back links "← Volver" | 8 duplicates | |
| "guardado" banners | 4 duplicates | |
| Badges / pills | ~15 | same idea, drifting padding/size |
| Form labels | 3 styles | `text-ink` / `text-black` / `text-gray-700` |
| Section headings | 2 sizes | `text-2xl` vs `text-3xl` |

Blank-while-loading routes:
- `CourseCatalogContext` has **no loading flag** → `Courses`, `Dashboard`, `MyCourses`, `Favorites`, `CourseDetail` render false empty states ("no hay cursos") while the catalogue loads.
- `AdminDashboard` and `AdminSales` have no loading flag → render zeros until the fetch resolves.

## Decisions

- One shared component per function; migrate every call site.
- Unified loading = the **🧵 ("hilo") centred**, with a subtle pulse, in three sizes (page / section / inline).
- Reuse the existing primitives where they already exist (`.btn*`, `card-flat`, `DialogContext`, `PageHeader`, `Pagination`, `getImageUrl`, tokens).
- Respect the design system: depth ≤ 1, tokens only, no hardcoded hexes, flat page headers.

## Tasks

### Work unit 1 — loading (the user's example)
- [x] **T1** `LoadingState` component (+ test): props `size` (`page` | `section` | `inline`), optional `label`, optional `emoji` (default 🧵). `page` = `min-h-screen flex items-center justify-center`; `section` = `flex items-center justify-center py-24 animate-fade-in`; `inline` = small centered text style.
- [x] **T2** Migrate every loading UI to `LoadingState` (route guards, public pages, admin sections, dropdown/modal inline loaders). Remove the `🎉` variant.
- [x] **T3** Add a `loading` flag to `CourseCatalogContext` and use it in `Courses`, `Dashboard`, `MyCourses`, `Favorites`, `CourseDetail` so they show `LoadingState` instead of a false empty state.
- [x] **T4** Add loading flags to `AdminDashboard` and `AdminSales` (do not render zeros/empty while loading).

### Work unit 2 — empty + error
- [x] **T5** `EmptyState` component (+ test) `{icon,title,description,action}`; migrate the ~20 sites and unify the search-empty copy + "Limpiar" action.
- [x] **T6** `ErrorState` component (+ test) `{icon,title,description,onRetry?}`; migrate the ~12 sites.

### Work unit 3 — repeated controls
- [x] **T7** `SearchInput` component (+ test); migrate the 9 identical inputs (+ the `ConsultasSection` variant).
- [x] **T8** `BackLink` component (+ test); migrate the 8 "← Volver" links.
- [x] **T9** `Badge` component (+ test); migrate the ~15 pills to one padding/size scale.
- [x] **T10** `SuccessBanner` (and a shared `InlineAlert` for danger) (+ test); migrate the "guardado" banners and the red error banners.

### Work unit 4 — modals + typography
- [x] **T11** `Modal` component (+ test): portal + overlay + panel + header/close + scrollable body; one z-index scale. Migrate `DialogContext`, `AdminUsers` detail and `CertificateRequestDetail` to it. The sidebar drawer and the WelcomeToast/PushConsentBanner overlays are documented different patterns and were left at their own z-indexes.
- [x] **T12** Unify form labels and section-heading sizes; make `Profile` use the shared `PageHeader` instead of a hand-rolled clone.

## Constraints

- Additive/behaviour-preserving: no feature or copy changes beyond what unification requires.
- Every new component gets tests; migrate call site by call site.
- `depthGuard.test.jsx` and other pinning tests must be updated only where the markup legitimately changed, never weakened.

## Acceptance criteria

- One component per function; no duplicated search-input class string, back link, badge or "guardado" banner.
- No route renders a blank/false-empty state while loading.
- Loading looks the same everywhere (🧵 centred, consistent wrapper per context).
- `npm test`, `npm run lint`, `npm run build` pass.

## Verification

- `cd costura-app && npm test`, `npm run lint`, `npm run build` after each work unit.
- Manual: navigate every route with a throttled network and confirm the loading/empty/error look is consistent.

## Delivery

Forecast: large (touches most of `costura-app/src`). Work unit by work unit on `dev`; PRs per unit or a single PR at the end, as the user prefers.

## Progress

- 2026-10-08: audit complete; document created; scope confirmed (do everything, in work units, starting with loading). Implementation not started.
- 2026-10-08: WU1 (loading) done — `LoadingState` (page/section/inline), all loaders migrated, loading flags added to CourseCatalogContext/AdminDashboard/AdminSales. Frontend 132 -> 138 tests. Commits `dbbf511` + docs.
- 2026-10-08: WU2 (empty + error) done — `EmptyState` and `ErrorState` (card/plain/inline and card/banner/inline), ~32 sites migrated, search-empty copy unified, red banners now use the `danger` token. Frontend 138 -> 151 tests. Not committed yet.
- 2026-10-08: WU3 (repeated controls) done — `SearchInput`, `BackLink`, `Badge`, `SuccessBanner` (+ tests): 9 search inputs migrated (ConsultasSection filter input left as-is: plain filter styled to match its sibling select, not the magnifier search pattern), 6 back links migrated (CourseDetail's btn-primary CTA and ErrorState action are different patterns; Checkout/PatternCheckout `mb-6 inline-block` normalized to the shared `mb-4`), ~16 pills unified to one scale/tones, 5 "guardado" banners migrated (Profile's plain-text notice became the boxed banner). `InlineAlert` intentionally NOT created — danger banners already use `ErrorState variant="banner"` (WU2). Kept as-is with justification: CourseCard level chip (image overlay, level colour scale, needs shadow/px-3), CourseProgressCard "✓ Certificado enviado" (small centred status line, not a banner). Frontend 151 -> 162 tests. Not committed yet.
- 2026-10-08: WU4 (modals + typography) done — `Modal` (portal, sizes sm/md/lg, one z-index scale, baked fuchsia accent bar) migrated `DialogContext` (API unchanged; confirm keeps backdrop/Esc inert by design), `AdminUsers` detail and `CertificateRequestDetail`; `Badge` no longer forces uppercase (user feedback: "De pago" renders as-is); form labels unified to `text-sm font-medium text-text-ink mb-1.5` (incl. the CourseFieldsForm/CourseAttachmentsSection leftovers); section headings unified to `text-2xl`; `Profile` uses `PageHeader`. The events public page keeps its designed hex palette (brand pink/green + 6 soft card colours) on purpose (mapping tokens would shift its exact colours). Frontend 162 -> 171 tests. Not committed yet.
- Delivery note for this feature: commits `dbbf511` (WU1), `90c20fa` (WU2), `56e99d2` + `4ef674a` (search-empty fixes), `442ab68` (WU3) are on dev; WU4 not committed yet.
