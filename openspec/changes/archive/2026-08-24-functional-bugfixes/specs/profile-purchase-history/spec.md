# Delta for profile-purchase-history

## ADDED Requirements

### Requirement: Profile self-edit

The system MUST expose `PATCH /users/:id` allowing a user to update their own name, email, and country (owner-or-admin); the Profile page and AuthContext MUST persist these changes via the API and merge the server response.

#### Scenario: Persist edits

- GIVEN an owner edits name/email/country
- WHEN `PATCH /users/:id` is called
- THEN the profile updates and survives reload

#### Scenario: Non-owner blocked

- GIVEN a non-admin edits another user's profile
- WHEN requested
- THEN 403

#### Scenario: Conflict error

- GIVEN an email already used by another account
- WHEN the PATCH is attempted
- THEN a clear 409 error is returned and no change persists

### Requirement: Country required at registration

Registration MUST require a country so email language always resolves.

#### Scenario: Missing country rejected

- GIVEN a registration without a country
- WHEN submitted
- THEN it fails with a clear validation error

#### Scenario: Country provided

- GIVEN a registration with a country
- WHEN submitted
- THEN it succeeds and stores the country

### Requirement: Email-uniqueness error contract

The profile/purchase-history API MUST return a clear 409 with a descriptive message when an email uniqueness conflict occurs.

#### Scenario: 409 on duplicate

- GIVEN an attempt to set an email owned by another account
- WHEN the API handles it
- THEN it returns 409 with a clear message

#### Scenario: No data leak

- GIVEN the 409 response
- WHEN returned
- THEN no other user's data is exposed
