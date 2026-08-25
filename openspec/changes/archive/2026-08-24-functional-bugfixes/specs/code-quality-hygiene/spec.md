# code-quality-hygiene Specification

## Purpose

Backend lint configuration and removal of noisy frontend console logging.

## Requirements

### Requirement: Backend ESLint configuration

The backend MUST ship an ESLint config (typescript-eslint recommended) so that `npm run lint` succeeds.

#### Scenario: Lint passes

- GIVEN the backend repo with the config present
- WHEN `npm run lint` runs
- THEN it completes without a "couldn't find a configuration file" error

#### Scenario: Config present

- GIVEN the backend root
- WHEN scanned for an eslint config
- THEN exactly one recognized config file exists

### Requirement: No noisy console logging

The frontend API service MUST NOT log every request/response to the console.

#### Scenario: Requests silent

- GIVEN a request/response through api.js
- WHEN it completes
- THEN no request/response console output is emitted

#### Scenario: Real errors still surfaced

- GIVEN an actual error
- WHEN it occurs
- THEN genuine errors remain visible for debugging
