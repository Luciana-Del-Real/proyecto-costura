# mail-service Specification

## Purpose

Email sending fails loudly and stays disabled until enabled.

## Requirements

### Requirement: Loud failure

Mail service MUST depend on `@sendgrid/mail` and MUST surface send failures loudly, never silently swallow them.

- **Successful send logged** — GIVEN valid send attempt, WHEN service sends, THEN outcome is logged explicitly.
- **Send failure surfaced** — GIVEN send attempt fails, WHEN service sends, THEN error is logged and propagated.

### Requirement: Sending disabled by default

System MUST NOT enable real sending in this change; sending MUST be env-gated and off by default.

- **Default disabled** — GIVEN default environment, WHEN service initializes, THEN no real emails are sent.
- **Enabled via env** — GIVEN env flag enables sending, WHEN service initializes, THEN sending permitted, failures stay loud.