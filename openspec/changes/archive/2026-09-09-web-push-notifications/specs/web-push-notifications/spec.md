# Web Push Notifications Specification

## Purpose

Delivers every in-app bell notification to the user's devices via standard Web Push (`web-push` + VAPID). The backend owns subscription storage, VAPID signing, per-user dispatch from the two existing creation chokepoints, and expired-subscription pruning — under an isolation contract: push MUST NEVER affect notification creation.

## Requirements

### Requirement: PushSubscription Persistence

The system MUST store push subscriptions in a `PushSubscription` model: required `userId` foreign key with cascade delete, unique `endpoint`, required `p256dh` and `auth` keys, optional `userAgent`, and `createdAt`/`updatedAt`, backed by a Prisma migration. A user MAY hold one subscription per device.

#### Scenario: User subscribes on two devices

- GIVEN an authenticated user with one existing subscription
- WHEN the user subscribes from a second device
- THEN a second PushSubscription row is created for the same userId

#### Scenario: Repeated subscribe to the same endpoint

- GIVEN a stored subscription for an endpoint
- WHEN the user resubscribes with the identical endpoint
- THEN the existing row is upserted, not duplicated

#### Scenario: User account deleted

- GIVEN a user with stored subscriptions
- WHEN the account is deleted
- THEN all their PushSubscription rows are removed by cascade

### Requirement: JWT-Guarded Subscription Endpoints

The system MUST expose `POST /push-subscriptions` (upsert) and `DELETE /push-subscriptions/:endpoint`, both JWT-guarded. DELETE MUST be limited to the subscription owner (or an admin).

#### Scenario: Authenticated subscribe

- GIVEN a valid JWT and a valid subscription payload
- WHEN the user POSTs to /push-subscriptions
- THEN the subscription is stored for that user and 201 is returned

#### Scenario: Unauthenticated request

- GIVEN no valid JWT
- WHEN a client POSTs or DELETEs a subscription
- THEN the request is rejected with 401

#### Scenario: Deleting another user's subscription

- GIVEN a subscription owned by user A
- WHEN user B DELETEs it
- THEN the request is rejected with 403

### Requirement: Chokepoint Push Dispatch (Isolation Contract)

`createNotification` and `createNotificationsForAdmins` MUST dispatch push after creation, deferred past transaction commit, fire-and-forget. Push MUST NOT break, delay, or roll back notification creation; send failures MUST be logged and swallowed. The payload MUST derive from the notification's `title`, `message`, and optional `link` as `data.url`.

#### Scenario: Push send fails, notification still works

- GIVEN a notification created successfully
- WHEN the deferred push send fails
- THEN the notification remains (visible in the bell), the caller's request succeeds, and the error is logged

#### Scenario: Transaction rolls back

- GIVEN a caller transaction creating a notification
- WHEN the transaction rolls back
- THEN no push is sent for the rolled-back notification

#### Scenario: Notification with link

- GIVEN a notification with title, message, and link
- WHEN push is dispatched
- THEN the payload contains title, message, and url equal to the link

### Requirement: Per-User Targeting and Admin Fan-Out

The system MUST send one push per recipient subscription. Admin fan-out MUST be N sends, one per subscribed admin.

#### Scenario: Multi-device user

- GIVEN a user with two subscriptions
- WHEN a notification is created for that user
- THEN two pushes are sent

#### Scenario: Admin fan-out

- GIVEN three admins, two with subscriptions
- WHEN `createNotificationsForAdmins` runs
- THEN two pushes are sent (one per subscribed admin)

### Requirement: Expired Subscription Pruning

The system MUST delete a subscription when the push service responds HTTP 404 or 410, and MUST continue sending to remaining subscriptions.

#### Scenario: Expired subscription pruned mid-fan-out

- GIVEN two subscriptions, one expired (410)
- WHEN push is dispatched
- THEN the expired row is deleted and the valid one still receives the push

### Requirement: VAPID Configuration Hygiene

The system MUST load `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, and `VAPID_SUBJECT` from backend-only environment configuration. The private key MUST NOT be exposed to the frontend through any endpoint or bundled asset.

#### Scenario: Private key never exposed

- GIVEN a deployed backend
- WHEN the frontend bundle and public endpoints are inspected
- THEN no VAPID private key material is present