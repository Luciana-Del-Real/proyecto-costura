# favorites-notifications-integration Specification

## Purpose

Favorites and notifications backend-backed; frontend state split by responsibility.

## Requirements

### Requirement: Favorites via backend

System MUST read and write favorites via the backend; sessionStorage MUST NOT be the source of truth.

- **Toggle persists** — GIVEN authenticated user toggles a favorite, WHEN saved, THEN it persists via backend.
- **Unauthenticated toggle rejected** — GIVEN unauthenticated toggle, WHEN requested, THEN rejected, no local mutation.

### Requirement: Notifications via backend

System MUST fetch and update notifications via the backend; read state MUST NOT rely on sessionStorage.

- **Rendered from backend** — GIVEN backend notifications exist, WHEN UI loads, THEN list renders from backend.
- **Fetch failure surfaced** — GIVEN backend unreachable, WHEN fetching, THEN error surfaces, no silent stale data.

### Requirement: CoursesContext split

Frontend MUST split `CoursesContext` into single-responsibility contexts per domain.

- **Separate contexts** — GIVEN frontend state layer, WHEN inspected, THEN each domain owns its context.
- **No cross-domain coupling** — GIVEN one domain updates, WHEN others render, THEN their state is untouched.
