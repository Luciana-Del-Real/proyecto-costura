# Archive Report — code-quality-refactor

## Change

- **Name**: `code-quality-refactor`
- **Archived**: 2026-08-21 → `openspec/changes/archive/2026-08-21-code-quality-refactor/`
- **Artifact store**: hybrid (OpenSpec files + Engram)
- **Verdict at close**: PASS WITH WARNINGS — 0 CRITICAL, 0 blockers (per `verify-report.md` and Engram `sdd/code-quality-refactor/verify-report` #23)

## Final State (at close)

The SDD cycle is complete. This report is the terminal record and reflects the state of the change AT CLOSE, not at earlier snapshot times.

- **Tasks**: 32/32 complete; archived `tasks.md` has 0 unchecked implementation tasks.
- **Specs synced**: all 6 delta specs promoted to new main specs under `openspec/specs/` (no main specs existed before this change).
- **Verification (at verification time, per verify-report #23)**: both builds exit 0; tests 65 passed (backend jest 32, costura-app vitest 33), exit 0; 12/12 requirements and 24/24 scenarios compliant; `gentle-ai sdd-verify-validate --requirements 12 --scenarios 24` → valid.
- **Post-verify work completed after verify-report was persisted** (final-state facts, outrank the intermediate snapshot):

  1. **WARNING 3 (pre-existing) resolved** — `costura-app/src/pages/ResetPassword.jsx` no longer logs the reset token/password; the `console.log("Token:", token, "Password:", form.password)` line was removed after verification.
  2. **WARNING 2 resolved** — doc sweep replaced stale `npm run db:push` references with `npm run db:migrate` (migrations-only) in: `ARQUITECTURA.md` (×2), `BACKEND-SUMMARY.md`, `backend/CHECKLIST.md` (×2), `INVENTORY.md`, `POSTGRESQL_SETUP_GUIDE.md`, `POSTGRES_SETUP.md`, `backend/scripts/setup-postgres.sql`.

## Specs Synced

| Domain | Action | Details |
|--------|--------|---------|
| auth-admin-security | Created | 2 requirements (JWT secret from environment, Admin without plaintext bootstrap) |
| access-control-ownership | Created | 2 requirements (Profile access self or admin only, Notification ownership) |
| data-schema-migrations | Created | 2 requirements (Schema and migrations aligned, Migrations only sync mechanism) |
| favorites-notifications-integration | Created | 3 requirements (Favorites via backend, Notifications via backend, CoursesContext split) |
| mail-service | Created | 2 requirements (Loud failure, Sending disabled by default) |
| profile-purchase-history | Created | 1 requirement (Real purchase history) |

No main specs existed in `openspec/specs/` before this change; all 6 deltas were full specs promoted mechanically (shell `cp` + `diff -r` + `mv`). No destructive merge was performed, so no merge warning was required (config `rules.archive`).

## Archive Contents

- `proposal.md` ✅
- `exploration.md` ✅
- `specs/` ✅ (6 domain spec.md files)
- `design.md` ✅
- `tasks.md` ✅ (32/32 tasks complete, 0 unchecked)
- `verify-report.md` ✅
- `archive-report.md` ✅ (this file, additive-only)

## Follow-ups Left Open (non-blocking)

1. **WARNING 1 (awareness note, not a defect)** — `backend/scripts/create-admin.js`: `@prisma/client` auto-loads `backend/.env` (gitignored) at import. On a machine whose `.env` is provisioned with `ADMIN_*`, the script always creates/updates that admin even with no shell env. This is the intended env-only provisioning path (no source defaults; grep clean), but operators should know the script is driven by `.env` as much as by explicit args.
2. **SUGGESTION** — `openspec/config.yaml` is stale: `verify.test_command: ""` and the context still say "no test runner installed". Update to `npm test` (both apps) so future verification runs inherit the real commands.
3. **SUGGESTION** — Root `README.md` is UTF-16-LE encoded (git treats it as binary) and lacks the `MAIL_ENABLED` row; convert and add the row in the deferred MEDIUM/LOW encoding cleanup.
4. **SUGGESTION** — Promote the verify-session temp-only "Fetch failure surfaced" test into the repo suite to make that coverage permanent.
5. **SUGGESTION** — costura-app build emits a pre-existing chunk-size warning (dashjs > 500 kB); consider code-splitting in a later hygiene change.

## Mechanical Integrity (diff -r readbacks)

All copies/moves performed with native shell binaries (`cp`, `mv`; `git mv` fell back to `mv` because `openspec/` is untracked). Verbatim `diff -r` outputs were empty (byte-identical) for:

- Each of the 6 spec promotions: `openspec/changes/code-quality-refactor/specs/{domain}/spec.md` vs `openspec/specs/{domain}/spec.md`
- The archive move: pre-move recursive snapshot vs `openspec/changes/archive/2026-08-21-code-quality-refactor/`

## Traceability (Engram observation IDs read)

- `#15` — `sdd/code-quality-refactor/apply-progress` (full content)
- `#23` — `sdd/code-quality-refactor/verify-report` (full content)

Supporting previews seen in search results (not read in full): `#22` (sessionStorage fallback removal, bugfix), `#24` (verify discovery).

## Gate Notes

- **Native Review Receipt Gate**: `reviewGate` structurally absent (no `reviews/` directory in the change folder; no review discovered for this candidate). Archive proceeded under ordinary repository policy.
- **Task Completion Gate**: passed — archived `tasks.md` shows 32/32 checked, 0 unchecked.
- **CRITICAL gate**: `verify-report.md` has 0 CRITICAL findings; no block.
- **Action context**: `execution_mode: interactive`; no workspace-planning mode; no `allowedEditRoots` restriction. No source code modified by the archive phase.