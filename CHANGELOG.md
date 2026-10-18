# Changelog

## 2.8.1 — 2026-10-18

- Presentation Date Selection at Session Creation: added explicit presentation date picker during session creation with automatic prefill from student group and full lecturer customization.
- Revised Standard Academic Criteria & Weights: new sessions default to Documentation (40%), Logical Structure (30%), and Presentation (30%). Existing grading names/weights are preserved; legacy labels retain their original meaning in both languages.
- Validate session creation/edit dates on the server; use the local calendar for defaults and preserve manually selected dates when editing the session title.
- Single-Screen No-Scroll Modal Architecture: refactored session creation form into an ergonomic 2-column grid layout with compact inline criteria management, eliminating vertical scrolling across desktop, laptop, and tablet viewports.
- Upgraded patch version to 2.8.1 across package manifests, server health endpoints, and global footers.

## 2.8.0 — 2026-10-17

- Unified Demo Toggle Control: administrator settings enable or disable demo data insertion and student voting previews, enforced by the server. The login screen never displays test credentials, regardless of the toggle.
- Production integration preserves hardened authentication and deployment settings, protects CSV imports with group ownership checks, and reveals public results only after the lecturer selects Show results. Reveal failures remain retryable.
- Button Spacing & Action Layout Refinement: eliminated button overlapping in user management cards with responsive gap spacing (`gap: 0.65rem`) across all screen widths.
- Fully Responsive Login Viewport: optimized login page wrapping, landscape support, safe-area insets, and vertical centering for seamless mobile and desktop compatibility.
- Upgraded minor version to 2.8.0 across package manifests, server health endpoints, and global footers.

## 2.7.0 — 2026-10-17

- Harmonized Teal Palette & Monochromatic Lighter Gradient: standardized the primary academic base color to Teal (`#0d9488`), and styled banners (Final Results banner and mobile institutional brand bar) to transition seamlessly from base teal to a lighter, whiter tint of the same hue (`#2dd4bf` / `color-mix(in srgb, #0d9488 55%, white)`).
- Mandatory Password Change Screen Theming: explicitly enforced the teal base theme on initial password change (`/account`) and login (`/login`) with customized security card styling.
- Admin & Professor Unified Command Center: comprehensive visual overhaul of the Professor Dashboard and Administrator control hubs with quick statistics, live session monitoring, and zero-pill metadata discipline.
- Instant Single-Click Results Reveal & Modal Lockout Fix: resolved modal re-opening and disabled button freeze via synchronized ref state, ensuring single-click instant reveal across projector, lecturer, and student mobile screens.
- Session Archiving Flow Restored: wired session header archiving directly to atomic persistence and immediate dashboard transition.
- Upgraded minor version to 2.7.0 across package manifests, server health endpoints, and global footers.

## 2.6.1 — 2026-10-16

- Mandatory Non-Dismissible Results Prompt: updated session completion popup to present exclusively the "Show results" option with no archiving option and non-dismissible modal protection.
- Instant Simultaneous Reveal: clicking results reveal immediately displays rankings on projector and student screens simultaneously in 1 click.
- Automatic Dashboard Transition: archiving a completed session now automatically transitions the lecturer back to the dashboard/table to create or activate a new session.
- Upgraded minor version to 2.6.1 and reinforced constitutional approval and Greek-only communication rules in agents.md.

## 2.6.0 — 2026-10-16

- Student Voting Button Locking: submit button is locked and cannot be clicked (`disabled`) when a vote has already been submitted and no scores have changed, preventing redundant submissions and providing clear visual feedback.
- Accurate Medal Nomenclature: standardized the podium award terminology to the official academic/Olympic terms: 🥇 Χρυσό (Gold), 🥈 Αργυρό (Silver), 🥉 Χάλκινο (Bronze).
- Upgraded minor version to 2.6.0 across all manifests, server health endpoints, footers, and project documentation.

## 2.5.1 — 2026-10-16

- Redesigned user menu: replaced the legacy gear icon with a modern user profile avatar icon with dropdown chevron.
- Embedded color theme switcher directly inside the user menu dropdown with interactive theme swatches.
- Added password visibility toggle ("eye" icon) for seamless reveal/hide across Login, Account password change, and Admin user creation.
- Removed floating theme picker widget from bottom-right corner, streamlining UI into the user navigation menu.
- Fixed CSV import endpoints, payloads, header trimming, and atomic persistence.
- Refined student waiting screen layout: removed footer, condensed typography, and enabled smooth vertical scrolling.

## 2.5.0 — 2026-10-15

- Upgraded production dependencies and build tools to latest versions: Express 5, Multer 2, Vite 8, TypeScript 7, @vitejs/plugin-react 6, bcryptjs 3, and @types/node 26.
- Added application footer displaying copyright symbol, current year, creator attribution (George Kalemis / Γιώργος Καλέμης), and version number across all main screens.
- Audited codebase and removed unused imports in backend routes and redundant props in removal accordions.
- Enforced strict 250-line file limit constitutionally across all TypeScript, TSX, and CSS files.
- Added project constitution rules for daily package update checks, automated subversion upgrades, and mandatory approvals for major upgrades.

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
