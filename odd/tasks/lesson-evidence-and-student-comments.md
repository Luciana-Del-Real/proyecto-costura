# Lesson evidence + comments grouped by student

## Objective

1. Require students to attach **evidence** (one image, mandatory + optional note) to complete each lesson.
2. Give admins a **per-student** view of comments and evidence, both in the Consultas inbox and inside the certificate-request review, so they can corroborate that a student actually did everything.

## Problem

- Admins reviewing a certificate request cannot see the student's comments or proof of work, so they cannot verify the student completed the tasks.
- The Consultas inbox groups threads by **course -> lesson**, so comments from different students get mixed and are hard to follow per student.
- Completing a lesson is a bare `PATCH /progress/lessons/:id {completed:true}` with **no proof of work** at all.

## Decisions (from the user)

- Evidence = **one mandatory image + an optional note**, per lesson completion.
- The admin sees the per-student view in **both** places: Consultas (grouped by student) and the certificate-request review (lessons + evidence + comments).

## Scope

In scope:
- Backend: nullable evidence fields on `LessonProgress` + migration; completion endpoint requires an image; admin certificate detail endpoint.
- Frontend (student): evidence upload flow (image required + optional note) to complete a lesson.
- Frontend (admin): Consultas grouped by student; certificate review detail with lessons + evidence + comments.

Out of scope:
- Changing the comment threading model.
- Retroactively requiring evidence for lessons already completed (existing progress stays valid and is not locked).
- Notifications for new evidence.

## Constraints

- **Additive DB change only** (nullable columns) on the shared Supabase DB. Note: `backend/.env` points at the shared Supabase DB, so creating the migration applies it there immediately — acceptable because it is additive.
- Reuse existing patterns: Multer `diskStorage`, `ImagePicker.jsx`, `api.js` helpers, `getImageUrl`.
- No breaking change for already-completed lessons.

## Tasks

- [ ] **T1** Backend schema: add `evidenceImage String?` and `evidenceNote String?` to `LessonProgress` (`backend/prisma/schema.prisma`) + migration `add_lesson_progress_evidence`.
- [ ] **T2** Backend API: `PATCH /progress/lessons/:lessonId` becomes multipart; requires an image to mark complete; stores image path + optional note; returns the updated progress.
- [ ] **T3** Backend API: `GET /admin/certificate-requests/:id/detail` returning the request, student, course, per-lesson progress with evidence, and that student's comments for the course (AdminGuard).
- [ ] **T4** Frontend (student): evidence upload flow in the lesson view (`LessonContent.jsx` + `ProgressContext`): image required + optional note; show evidence once completed.
- [ ] **T5** Frontend (admin): Consultas inbox grouped by **student** (then course -> lesson).
- [ ] **T6** Frontend (admin): certificate review detail panel showing lessons + evidence + comments per student/course.
- [ ] **T7** Tests: backend (completion rejected without evidence; stores image + note) and frontend (upload required; grouping by student).

## Route per task

| Task | Route | Trigger evidence |
| --- | --- | --- |
| T1 | delegated writer | schema + migration, part of the backend work unit |
| T2 | delegated writer | backend multi-file |
| T3 | delegated writer | backend multi-file |
| T4 | delegated writer | frontend multi-file |
| T5 | delegated writer | frontend multi-file |
| T6 | delegated writer | frontend multi-file |
| T7 | delegated writer | tests alongside the work units |

## Acceptance criteria

- A student cannot mark a lesson complete without attaching an image; with the image (and optional note) it completes and the evidence is visible afterwards.
- Already-completed lessons remain completed and are not re-locked.
- The Consultas inbox shows one section per student, with their courses/lessons underneath.
- Opening a certificate request shows that student's lessons, their evidence images/notes, and their comments for that course.
- Existing lesson comments (threads + optional images) keep working unchanged.

## Verification

- Backend: `cd backend && npm run typecheck`, `npm test`.
- Frontend: `cd costura-app && npm test`, `npm run lint`, `npm run build`.
- Manual: complete a lesson without an image (must be blocked), with an image (must succeed), then review it as admin in both screens.

## Delivery

Forecast: ~600-900 authored lines (backend + frontend + tests). Repo flow is `dev` -> PR -> `main`; plan is a single PR into `main` after the work units land on `dev`, revisiting a chain if the user prefers.

## Progress

- 2026-10-08: feature document created. Exploration complete (comments, Consultas, certificates, lesson progress). Product decisions captured. Implementation not started.
