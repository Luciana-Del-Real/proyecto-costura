# Delta for access-control-ownership

## ADDED Requirements

### Requirement: Public course payload projection

The public course catalog/detail payload MUST NOT include `videoUrl`, `pdf`, or `attachments`; anonymous visitors MUST see lesson titles only.

#### Scenario: Anonymous catalog

- GIVEN an anonymous `GET /api/courses`
- WHEN the payload returns
- THEN no `videoUrl`/`pdf`/`attachments` appear; only titles are present

#### Scenario: Owned full content

- GIVEN an approved learner
- WHEN they fetch from the protected lesson endpoint
- THEN full video/PDF/attachment content is available

### Requirement: Lesson content access guard

`GET /courses/:courseId/lessons` and `GET /lessons/:id` MUST require authentication and MUST allow access only to the course owner, an admin, or a student with an approved purchase; others MUST receive 401/403.

#### Scenario: Approved student reads

- GIVEN a student with an approved purchase
- WHEN they GET lessons
- THEN full lesson content returns 200

#### Scenario: Non-purchased student blocked

- GIVEN an authenticated student without an approved purchase
- WHEN they GET lessons
- THEN 403 with no content leak

#### Scenario: Anonymous visitor

- GIVEN no token
- WHEN lessons are requested
- THEN 401; titles-only still visible via the catalog

### Requirement: Purchase record ownership

`GET /purchases/:id` MUST return a purchase only to its owner or an admin; any other authenticated user MUST receive 403.

#### Scenario: Owner reads

- GIVEN a user requests their own purchase
- WHEN `GET /purchases/:id`
- THEN 200

#### Scenario: Other user blocked

- GIVEN a non-admin requests another user's purchase
- WHEN requested
- THEN 403 (IDOR closed)

### Requirement: Progress access purchase check

`GET /progress/courses/:courseId` MUST be allowed only for a user with an approved purchase of that course (or an admin); others MUST receive 403.

#### Scenario: Approved user reads

- GIVEN an approved student
- WHEN they GET progress
- THEN 200

#### Scenario: Non-purchased user blocked

- GIVEN an authenticated student without approval
- WHEN they GET progress
- THEN 403

### Requirement: Access request-approve-revoke lifecycle

Student access MUST follow request → admin approve (unlock) or deny (revoke); denial MUST be reversible by a later approval.

#### Scenario: Approve unlocks

- GIVEN an admin approves a pending request
- WHEN approval is recorded
- THEN access unlocks (video/PDF/attachments) and an in-app notification is created

#### Scenario: Deny revokes

- GIVEN an admin denies a request
- WHEN denial is recorded
- THEN access is revoked and the student loses full content

#### Scenario: Re-approve restores

- GIVEN a previously denied request
- WHEN an admin approves it again
- THEN access is restored (reversible)

### Requirement: Unlock notification

The system MUST create an in-app notification to the student when their access is unlocked by approval.

#### Scenario: Unlock notified

- GIVEN access unlocks on approval
- WHEN approval completes
- THEN a notification appears in the student's in-app notifications

#### Scenario: No notification on deny

- GIVEN a denial
- WHEN denial completes
- THEN no unlock notification is created
