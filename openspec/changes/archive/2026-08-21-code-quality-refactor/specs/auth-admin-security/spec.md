# auth-admin-security Specification

## Purpose

No secrets or admin credentials ship in source.

## Requirements

### Requirement: JWT secret from environment

Backend MUST load `JWT_SECRET` from env at boot and MUST NOT use a hardcoded fallback.

- **Boot with secret set** — GIVEN `JWT_SECRET` is set, WHEN backend boots, THEN tokens use that secret.
- **Boot without secret** — GIVEN `JWT_SECRET` is unset, WHEN backend boots, THEN startup fails fast with a clear error.

### Requirement: Admin without plaintext bootstrap

System MUST NOT create an admin at bootstrap with a plaintext password; admins MUST come from env/script only.

- **Admin via script** — GIVEN provisioning runs with admin env credentials, WHEN admin is created, THEN password is stored hashed.
- **Boot without admin env** — GIVEN backend boots without admin credentials, WHEN startup completes, THEN no admin is auto-created.
