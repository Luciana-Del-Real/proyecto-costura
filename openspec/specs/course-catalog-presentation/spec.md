# course-catalog-presentation Specification

## Purpose

Frontend catalog rendering: correct level badges, image URL abstraction, and placeholder covers.

## Requirements

### Requirement: Level badge color mapping

The system MUST render level badges from the backend uppercase enum (`PRINCIPIANTE|INTERMEDIO|AVANZADO`) using a case-insensitive map so every valid level shows its correct color, and MUST NOT fall back to gray for a valid level.

#### Scenario: Principiante badge colored

- GIVEN a course with level `PRINCIPIANTE`
- WHEN CourseCard renders
- THEN the badge shows the Principiante color, never gray

#### Scenario: Uppercase enum mismatch handled

- GIVEN a course with level `INTERMEDIO` (uppercase, as stored by Prisma)
- WHEN rendered
- THEN the badge maps to the correct color and is never the gray fallback

#### Scenario: Unknown level fallback

- GIVEN a course with an unrecognized level value
- WHEN rendered
- THEN a neutral fallback appears; valid enums never hit gray

### Requirement: Image and attachment URL abstraction

The system MUST route all image and attachment `src`s through `getImageUrl(path)` and MUST NOT hardcode `http://localhost:3000` anywhere in the frontend.

#### Scenario: Image via abstraction

- GIVEN a course cover path
- WHEN CourseCard/AdminCourses/AdminDashboard/AdminCourseForm render it
- THEN the `src` resolves through `getImageUrl`, never a hardcoded origin

#### Scenario: No localhost remains

- GIVEN a search of `src/`
- WHEN looking for `http://localhost:3000`
- THEN zero matches remain

### Requirement: Placeholder course cover

The system MUST show a brand-consistent placeholder displaying the course name when a course has no cover image.

#### Scenario: Missing cover

- GIVEN a course without an image
- WHEN its cover renders
- THEN a placeholder bearing the course name is shown, with no broken image

#### Scenario: Present cover

- GIVEN a course with a cover
- WHEN rendered
- THEN the real image is shown, not the placeholder
