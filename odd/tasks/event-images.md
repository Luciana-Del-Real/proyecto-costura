# Feature: Event images (upload + blurred card background)

## Objective
Allow adding an image to each event from the admin create/edit form; that image becomes the background of the whole public event card, blurred but noticeable.

## Problem
Events are text-only flyers. The `Event.image` column already exists (migration `20260927181110_event_flyer_image`, schema.prisma:306) and the DTOs/service already persist it, but there is no upload path (the admin controller is JSON-only and its comment says the field is legacy/unused) and the card never renders it.

## Why
Product request: image backgrounds give the event cards visual impact without shipping a full flyer design.

## Scope
- `backend/src/events/admin-events.controller.ts` — multer upload for field `image` (folder `./uploads/events`), same diskStorage pattern as `patterns.controller.ts`, on POST and PUT. Keep the "notify students on create" flow intact.
- `costura-app/src/services/api.js` — `createEvent`/`updateEvent` become FormData-aware (FormData -> postForm/putForm, else JSON).
- `costura-app/src/pages/admin/AdminEventForm.jsx` — image field with FilePicker + preview; submit FormData when a file is selected.
- `costura-app/src/pages/Events.jsx` — EventCard renders the image as a blurred, noticeable background (absolute `img` blur + scale, white/50 overlay, content above with z-10); pastel palette stays as the no-image fallback.

## Out of scope
- No schema/migration change (column already exists).
- No admin-list thumbnail (not requested).
- No "remove image" control in the form.

## Constraints
- Every form field must keep its label with the project's standard label styling.
- Card text must stay readable; keep `borderColor` from the variant palette in both modes.
- Keep the per-file comment language (Spanish comments in these files).
- No `prisma generate` / schema work, so no Windows query-engine lock risk.

## Checklist
- [x] T1 Backend: FileFieldsInterceptor `image` upload on admin events POST/PUT -> `dto.image = '/uploads/events/<file>'`
- [x] T2 Frontend api: FormData-aware `createEvent`/`updateEvent` (+ comment updated)
- [x] T3 AdminEventForm: image field (label + FilePicker + preview) and FormData submit
- [x] T4 EventCard: blurred noticeable background image when `event.image` is present
- [x] T5 Verify: backend build + tests; frontend tests + lint + build

## Route
- T1–T4: delegated direct — ONE bounded writer (4 non-trivial files across backend + frontend; writer trigger applied).
- T5: writer runs the authorized verification and reports `<command>: <observed result>`; parent does a spot check and the post-commit review assessment.

## Acceptance criteria
- An image chosen in the event form persists an `/uploads/events/...` path on create and update.
- The public event card shows the image as a blurred background with fully readable content.
- Events without an image keep the current pastel flyer look.
- Backend and frontend suites stay green.

## Verification evidence
- Writer (one bounded general agent, route delegated direct) implemented T1–T4 and ran the authorized checks:
  - `cd backend; npm run build` — ok
  - `cd backend; npm test` — 17 suites / 113 tests passed
  - `cd costura-app; npm test` — 30 files / 171 tests passed, exit 0
  - `cd costura-app; npm run lint` — clean
  - `cd costura-app; npm run build` — ok (Node module.register deprecation warning only)
- Parent spot check of the full diff: multer wiring mirrors patterns.controller.ts (field `image`, folder `./uploads/events`); notify-on-create flow intact; card keeps pastel fallback + `relative overflow-hidden` + blur/scale/white-50 overlay + z-10 content; form keeps the field-label and submit conventions.

## Review assessment
- `gentle-ai review assess --base-ref 82d4242 --committed-only`: risk **medium** (executable_change: admin-events.controller.ts), 5 paths / 172 lines, `review_due: false` — **under_budget**: se queda pendiente dentro del slice (no avanza el boundary). Si un commit posterior acumula ~400 líneas sobre el slice, saltará `slice_budget_reached` y se ejecutará el preflight STATUS.

## Next step
Parent spot check -> work-unit commit -> assess -> report -> user decides push/PR.