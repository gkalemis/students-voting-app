# Changelog

## 2.4.0 — 2026-10-09

- Establish the period → course → group → students hierarchy, with one presentation date per group and lecturer-owned management at every level.
- Add administrator cascading deletion of lecturers or any hierarchy level, including all subordinate sessions and voting data, while protecting the current administrator.
- Add student creation/deletion, group-derived session dates, and migration of existing course/period/group relationships.
- Add floating toast notifications, a home link in the application title, global logo upload, background color choices, and ten muted per-user theme colors.
- Display the active student, presentation subject, and live voting countdown on participant and projector screens.
- Replace prompt-based course, period, group, session, and lecturer creation with validated responsive dialogs and explicit relationships.
- Display created courses, periods, and groups so successful creation is immediately visible.
- Add persistent, complete Greek–English interface catalogs and a language switcher to authenticated, participant, and projector screens.
- Render structured API validation failures as readable field-specific messages instead of `[object Object]`.

## 2.3.0 — 2026-10-09

- Require bootstrap, new, and reset accounts to replace temporary passwords before accessing application features.
- Add a container CLI that generates reset passwords without process-argument exposure.
- Revoke existing JWTs on password change/reset using per-user authentication versions.
- Add login throttling, constant-cost unknown-user verification, trusted hosts, typed password input, upload expansion/dimension limits, and strict browser headers.
- Expand and sanitize public documentation and add a future-work register.
- Remove deployment-specific domains and proxy identifiers from the tracked tree; require them through the ignored runtime environment.
- Add mobile/tablet viewport metadata, safe-area handling, touch-sized controls, responsive dashboards, dialogs and tables, plus phone/tablet regression checks.
- Pin Traefik discovery to the configured external Docker network when the web service joins multiple networks.
- Fix strict TypeScript inference for presenter edits and restored participant scores.
- Initialize persistent-volume ownership before starting the non-root backend container.
- Make the password-enforcement migration idempotent for fresh and existing SQLite databases.
- Add a one-year HSTS response policy without enabling irreversible browser preload.
- Separate compiled frontend bundles under `/static/` from backend branding assets under `/assets/`, preventing a production white screen.
- Use Vitest's Vite-compatible configuration typing so production type-checking accepts the test configuration.
- Separate Vite production and Vitest test configuration to avoid cross-version plugin type collisions.
- Pin runtime/build images to Python 3.12.15 slim-trixie, Node 24.21.0 Alpine 3.24, nginx stable 1.30.5 Alpine 3.24, and Alpine 3.24.2.

## 2.2.0

- Combined complete v2.0 application foundation with multi-lecturer authorization, courses/groups/periods/sessions, imports, voting, anonymized ranking, exports, projector and Docker deployment.
- Added isolated concurrent session WebSockets and stable presentation identities.
- Added live presenter name/title editing with private audit history and vote preservation.
- Added persistent global and course-level institutional branding, safe raster uploads, preview, subtle backgrounds and Excel identity headers.
- Added automated lifecycle, isolation, security and branding tests.
- Prepared the repository for public GitHub use with an MIT license, contributor/security guidance, issue and pull-request templates, Dependabot, and CI.
- Added a self-service password-change screen while retaining administrator-only professor creation.
- Added environment-driven integration with an existing production Traefik instance.
- Consolidated existing-Traefik integration into the single `compose.yaml`; no separate override or direct host port is used.

