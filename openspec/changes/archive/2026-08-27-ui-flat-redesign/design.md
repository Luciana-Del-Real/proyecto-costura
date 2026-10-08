# Design: UI Flat Redesign

## Technical Approach

Implement the design-system delta as a JSX/CSS-only refactor in `costura-app/src`. Phase A removes repeated headers and wrappers; Phase B removes nested decorative surfaces at four hotspots. Content, actions, affordances, input borders, and ordering remain unchanged. The invariant is nesting depth ≤1.

## Architecture Decisions

| Decision | Alternatives | Rationale |
|---|---|---|
| Add `PageHeader`, not `Surface` | Duplicate markup; add a generic Surface helper | Header duplication is the largest drift source and has one stable contract. Surface would obscure page-specific one-surface choices and add little value to a CSS-only sweep. |
| Keep dense data/form surfaces selectively | Remove every card; retain all nested cards | Tables/forms need one readable boundary; inner decorative cards do not. |
| Keep mobile `section + section` rule unchanged | Remove it or scope it to new classes | Flattening does not require changing section semantics; existing stitched separators should continue to help mobile rhythm. Verify pages that use adjacent `section` elements. |

## PageHeader Contract

Create `components/PageHeader.jsx`:

```jsx
export default function PageHeader({ title, subtitle, accent = true }) {
  return <header className="max-w-6xl mx-auto px-1 pt-6 pb-2 animate-fade-up">
    <h1 className="font-display text-3xl md:text-4xl font-bold text-text-ink">{title}</h1>
    {subtitle && <p className="text-text-muted mt-1">{subtitle}</p>}
    {accent && <span aria-hidden="true" className="block w-16 h-1 bg-primary mt-3" />}
  </header>;
}
```
The root and children contain no `card*`, `bg-white`, rounded-surface, border, or shadow classes. It always renders, including empty states. `accent` is boolean; subtitle is optional.

## Page Replacements and Surface Ownership

Replace the exact banner `bg-white rounded-2xl border-2 border-primary shadow-md px-4 py-10 ...` in `Courses`, `PatronesGratis`, `Favorites`, `MyCourses`, `Profile` (move its avatar to a flat `bg-primary-soft rounded-full` identity row), `AdminUsers`, `AdminCourses`, `AdminPatterns`, `AdminSales`, and `AdminRequests` with `PageHeader`. Existing subtitles pass through; title-only pages pass no subtitle. Actions remain adjacent flat controls; no banner wrapper. Headers render before empty/loading content.

Remove `Dashboard`’s outer `card-glow`; course cards remain the surfaces. In `MyCourses`, remove the page wrapper only; course rows remain surfaces and `NotificationsInbox` remains the one notification surface (its notification rows remain affordances). In `AdminRequests`, keep one `card-glow` list surface and change each request row to flat `p-3 border-b border-border` rows. In `AdminCourseForm`, replace the two `card-glow p-8` panels with one `card-glow p-8` containing both form sections, using `seam-divider`/spacing between them.

## Hotspot Flattening

- **Checkout:** order-summary `card-glow` remains the sole surface. Make payment instructions flat; render transfer steps as whitespace/seam-separated sections, CVU/Alias/account rows as `border-b` rows (no `bg-white`, rounded, or nested card), and retain the warning as a tinted notice.
- **AdminCourseForm components:** `LessonEditorItem` becomes a flat lesson section with input borders preserved; PDF upload is a flat labeled area and attachment links are divider rows. `NewLessonForm` loses `card-glow` and dashed surface but keeps form controls and spacing. `CourseAttachmentsSection` removes both `bg-white ... rounded-xl` upload boxes; labels/pickers remain flat. The parent course form surface is the surviving surface.
- **AdminUsers:** modal shell stays the one `card-glow`; replace the two inner stat cards with a `divide-y`/bordered stat row layout. Avatars, chips, progress bars, and modal controls remain.
- **Profile:** saved toast becomes `text-primary text-sm px-0 py-2 mb-4` inline notice (no card); existing error notice and input borders remain. Keep the personal card as the single primary surface and make purchase history a flat divider-separated section.

## Data Flow

`PageHeader props → flat header DOM`; page state/data → unchanged lists/forms → retained single surface or divider rows. No routing, API, or state-flow changes.

## File Changes

| Files | Action | Description |
|---|---|---|
| `components/PageHeader.jsx` | Create | Shared flat header. |
| `pages/{Courses,PatronesGratis,Favorites,MyCourses,Profile}.jsx` | Modify | Headers, Dashboard/MyCourses wrappers, Checkout/Profile hotspots. |
| `pages/admin/{AdminUsers,AdminCourses,AdminPatterns,AdminSales,AdminRequests,AdminCourseForm}.jsx` | Modify | Headers, wrappers, modal/form/list flattening. |
| `components/admin/{LessonEditorItem,NewLessonForm,CourseAttachmentsSection}.jsx` | Modify | Remove nested surfaces. |
| `components/NotificationsInbox.jsx`, `index.css` | Modify | Preserve inbox affordances; verify mobile rule only if needed. |

## Testing Strategy

Add `components/PageHeader.test.jsx` for title, optional subtitle/accent, empty-state rendering, and absence of box classes. Update `components/smoke.test.jsx` imports/mocks; retain `Profile.test.jsx` and existing unit tests. Run `npm test`, `npm run lint`, and `npm run build` per PR. Manual QA: public (headers, filters, empty states), student (Dashboard/MyCourses/Notifications, Profile toast, Checkout payment/copy, mobile ≤640px), admin (headers/actions, tables/rows, modal stats, form uploads/lesson CRUD, mobile ≤640px). Audit rendered class strings for ≤1 nesting.

## Threat Matrix

N/A — no routing, shell, subprocess, VCS/PR automation, executable-file classification, or process-integration boundary.

## Migration / Rollout

Three chained PRs: **PR1 public** — `PageHeader` plus Courses, PatronesGratis, Favorites (Phase A); **PR2 student** — MyCourses, Profile, Dashboard, Checkout (Phase A wrappers/headers plus Phase B hotspots); **PR3 admin** — AdminUsers, AdminCourses, AdminPatterns, AdminSales, AdminRequests, AdminCourseForm and three admin components (Phase A plus Phase B hotspots). Each is independently revertible and kept under the review budget.

## Open Questions

None.
