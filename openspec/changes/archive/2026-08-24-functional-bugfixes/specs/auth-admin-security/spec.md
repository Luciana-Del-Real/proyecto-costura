# Delta for auth-admin-security

## ADDED Requirements

### Requirement: CORS restricted to computed origins

The backend MUST configure CORS using the computed origin list from `CORS_ORIGIN` and MUST NOT use `origin: true`.

#### Scenario: Allowed origin

- GIVEN a request from an origin in `CORS_ORIGIN`
- WHEN an OPTIONS preflight runs
- THEN it is allowed with credentials

#### Scenario: Foreign origin blocked

- GIVEN a request from an origin not in the list
- WHEN it runs
- THEN it is rejected

### Requirement: Reset-password flow completion

The frontend reset-password page MUST call the backend reset endpoint on submit and MUST validate password === confirm; the app MUST NOT ship broken `/api`-prefixed reset helper duplicates.

#### Scenario: Valid submit

- GIVEN a valid token and matching password/confirm
- WHEN the form submits
- THEN `POST /auth/reset-password` is called with the new password

#### Scenario: Mismatch rejected

- GIVEN mismatched password and confirm
- WHEN submitted
- THEN the request is blocked with a clear client error

#### Scenario: No dead helpers

- GIVEN the api service
- WHEN scanned for reset helpers
- THEN no `/api`-prefixed dead helpers remain (double-prefix 404 eliminated)
