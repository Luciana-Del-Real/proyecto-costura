# access-control-ownership Specification

## Purpose

Authorization rules closing IDOR gaps on profiles and notifications.

## Requirements

### Requirement: Profile access self or admin only

System MUST allow `users/:id` only to the owner or an admin and MUST return 403 to others.

- **Owner reads own profile** — GIVEN user requests their own id, WHEN `GET users/:id`, THEN profile returns 200.
- **Non-owner requests profile** — GIVEN non-admin user requests another id, WHEN `GET users/:id`, THEN 403 with no data leak.

### Requirement: Notification ownership

System MUST allow notification read/delete only to its owner or an admin and MUST return 403 otherwise.

- **Owner deletes own notification** — GIVEN user owns a notification, WHEN deleted, THEN operation succeeds.
- **Non-owner reads notification** — GIVEN notification belongs to another user, WHEN another user reads it, THEN 403.
