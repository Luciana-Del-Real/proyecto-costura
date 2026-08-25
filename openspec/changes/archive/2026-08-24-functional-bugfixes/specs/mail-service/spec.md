# Delta for mail-service

## ADDED Requirements

### Requirement: No purchase email sent

The system MUST NOT send an email when a purchase is recorded; the dead `/courses/:id` link send MUST be removed.

#### Scenario: Purchase silent

- GIVEN a purchase is recorded
- WHEN the purchase service completes
- THEN no email is sent

#### Scenario: No dead link

- GIVEN mail configuration
- WHEN purchase emails are reviewed
- THEN no email references the non-existent `/courses/:id` route

### Requirement: Reset-password email language by country

The reset-password email MUST be sent in a language resolved from the student's country: Spanish-speaking countries → Spanish, other countries → English, no country → Spanish.

#### Scenario: Spanish-speaking country

- GIVEN a student from a Spanish-speaking country
- WHEN the reset email is sent
- THEN it is in Spanish

#### Scenario: Other country

- GIVEN a student from a non-Spanish-speaking country
- WHEN the reset email is sent
- THEN it is in English

#### Scenario: No-country fallback

- GIVEN a student with no country
- WHEN the reset email is sent
- THEN it defaults to Spanish
