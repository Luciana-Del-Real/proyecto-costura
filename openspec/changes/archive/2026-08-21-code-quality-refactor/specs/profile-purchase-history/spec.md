# profile-purchase-history Specification

## Purpose

Profile shows real backend purchase history, no mock data.

## Requirements

### Requirement: Real purchase history

Profile MUST render purchases from the backend and MUST NOT use mock data; users with purchases MUST see a non-empty list.

- **Purchases displayed** — GIVEN user with backend purchases, WHEN Profile loads, THEN list is non-empty and real.
- **Empty state** — GIVEN user with no purchases, WHEN Profile loads, THEN empty state shown, no mock data.
