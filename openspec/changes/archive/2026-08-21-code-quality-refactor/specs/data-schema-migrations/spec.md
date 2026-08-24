# data-schema-migrations Specification

## Purpose

Fresh databases reproducible from migrations, never `db:push`.

## Requirements

### Requirement: Schema and migrations aligned

Prisma schema MUST match migration history; fresh DB MUST be reproducible from `migrate` alone.

- **Fresh DB reproduces schema** — GIVEN empty database, WHEN migrations apply, THEN full schema exists with no drift.
- **Drift detected** — GIVEN `migrate dev` reports drift, WHEN resolving, THEN an explicit migration is required.

### Requirement: Migrations only sync mechanism

Project MUST NOT use `db:push`; migrations MUST be the sole schema-sync path.

- **No db:push script** — GIVEN backend package scripts, WHEN inspected, THEN no `db:push` exists.
- **Backup before migration** — GIVEN non-empty database, WHEN migrations apply, THEN restorable backup exists first.
