# Project session summary

Last updated: 2026-10-09

Current release candidate: 2.4.0

## Completed

- Read `SPECIFICATION_V2.0.md` and `ADDENDUM_V2.2.md` completely and treated v2.2 as overriding amendments.
- Created FastAPI/SQLAlchemy application, React/TypeScript SPA, Alembic baseline, Docker/nginx deployment, environment template, tests and required documentation.
- Implemented roles/ownership, Argon2 authentication, course/period/group/student management, CSV/XLSX preview/import/templates, session creation/activation/control, session-scoped WebSockets, six-hour hashed tokens, admission locking, transactional vote upserts, early completion/anonymization, results/ties, exports and duplication.
- Implemented v2.2 live presenter edits/audit history and global/course branding with validated persistent raster assets.
- Added token-scoped submission rate limiting, formula-injection-safe exports, timer extension, criteria replacement while draft, archiving/ownership APIs, simulated demo generation, and persistent background uploads.
- Prepared the project for a public GitHub repository: MIT license, contribution/code-of-conduct/security policies, issue/PR templates, pinned frontend dependencies, Dependabot, Docker build exclusions, and GitHub Actions CI.
- Confirmed professor/user creation remains administrator-only at the backend and added an authenticated self-service password-change screen for every user.
- Consolidated discovery by an existing Traefik container into the single `compose.yaml`. The web service joins an environment-selected external network and publishes no host port. Public documentation contains no deployment-specific domain, host, network, router, entrypoint, or resolver identifiers.
- User requested explicit confirmation before all future changes; do not modify files or deployment state without receiving that confirmation.
- Implemented mandatory first-login password replacement for bootstrap/new/reset accounts, business-API restriction, a container-generated reset command, and JWT revocation through per-user authentication versions.
- Hardened unknown-user login timing, credential-scoped throttling, trusted hosts, password schemas, XLSX expansion limits, image dimensions, browser response headers, and public documentation.
- Added `TODO.md` as the authoritative register for email recovery, release validation, remaining UI, scaling, retention, and accessibility work.
- Sanitized deployment metadata from the tracked tree; real infrastructure identifiers now belong exclusively in the ignored deployment `.env`. Published Git history was not rewritten.
- Added mobile/tablet viewport metadata, safe-area padding, 44-pixel touch controls, overflow protection, adaptive navigation/cards/forms/tables/dialogs, portrait/landscape breakpoints, and static responsive regression checks.
- Added an explicit environment-driven `traefik.docker.network` label to prevent ambiguous network selection.
- Corrected strict TypeScript types for presenter-edit payloads and restored vote-score maps after the first container build exposed compiler errors.
- Added a one-shot `data-init` service to make the fresh persistent volume writable by non-root backend UID `10001`; backend startup now depends on successful initialization.
- Fixed migration `0002` to inspect and add only missing user security columns, avoiding fresh-install SQLite batch-table circular dependencies while preserving upgrades from older schemas.
- Added `Strict-Transport-Security` with a one-year lifetime and `includeSubDomains`; preload remains intentionally disabled.
- Fixed the production white screen by moving Vite bundles from the backend-reserved `/assets/` route to `/static/`; added a regression assertion for the namespace boundary.
- Corrected Vite/Vitest configuration typing after the container build rejected the `test` property under Vite-only types.
- Split `vite.config.ts` and `vitest.config.ts` after strict builds exposed incompatible nested Vite types in Vitest 2.
- Updated and pinned official base images: Python `3.12.15-slim-trixie`, Node `24.21.0-alpine3.24`, nginx `1.30.5-alpine3.24`, and Alpine `3.24.2`.
- Diagnosed the apparent lesson/user creation failure from production logs: course creation succeeded with HTTP 201, while lecturer creation returned a schema-validation 422 that the prompt UI hid.
- Replaced prompt-based resource and lecturer creation with validated responsive dialogs, explicit course/period/group selection, visible resource lists, and bilingual success/error feedback.
- Added persistent Greek–English translation catalogs and switching across login, authenticated administration, voting, results, account, and projector views.
- Added structured FastAPI validation-error rendering so field-level 422 responses remain readable.
- Superseded guarded deletion with administrator-authorized cascading deletion across lecturer → period → course → group → student/session/voting data; the current administrator remains protected.
- Added schema migration `0003` for the strict period → course → group hierarchy, common group presentation dates, and persisted per-user theme colors while deriving values for existing records where possible.
- Added lecturer student management, group-derived session dates, floating toast notifications, title-to-home navigation, global logo upload, subtle background choices, ten muted per-user theme colors, and live voting countdowns.

## Architecture decisions

- Bearer JWT login avoids cookie CSRF exposure; tokens are held by the SPA. Public voting uses a separate per-session header credential stored in localStorage.
- SQLite runs with FK enforcement, WAL and busy timeout. PostgreSQL is the documented growth path.
- Realtime events carry no data and prompt authoritative state reloads; channels are keyed by opaque public session ID.
- Completion stores timestamp-free anonymous criterion rows grouped only by random anonymous vote ID, then removes linked votes and participant credentials in one transaction.
- SVG branding upload is rejected because robust sanitization is not included.

## Test results

- `python3 -m py_compile backend/app/*.py backend/alembic/env.py backend/alembic/versions/*.py backend/tests/*.py`: PASS.
- `SECRET_KEY=... ADMIN_PASSWORD=... docker compose config --quiet`: PASS.
- Single-file existing-Traefik Compose configuration validation with test secrets: PASS.
- Secret hygiene check confirmed that no runtime `.env` exists in the project: PASS.
- Pattern-based repository secret scan: PASS; matches were only variable/form field names, not credentials.
- Post-hardening `git diff --check`, Python compilation, single-file Compose validation, sensitive-tracked-path scan, and private-key/token-pattern scan: PASS.
- Confirmed the authoritative v2.0 specification and v2.2 addendum have no modifications in the hardening diff.
- Post-sanitization current-tree scan for the previously published deployment domain and internal host name: PASS. Compose validation with neutral placeholder metadata: PASS.
- Test suite authored: 5 integrated backend scenarios plus frontend state-preservation and responsive-shell tests. These could not be executed here for the dependency reasons below.
- Backend pytest: BLOCKED in this workspace. `pip install -r backend/requirements.txt` could not reach the package index and FastAPI/SQLAlchemy/Pydantic are not preinstalled.
- Frontend Vitest/build: BLOCKED in this workspace. `npm install --prefer-offline` could not resolve dependencies from a local cache and network access is unavailable.
- Docker image build/runtime smoke test: BLOCKED because this execution user cannot access `/var/run/docker.sock` and required base images are not locally inspectable.
- Disposable-container migration validation after the `0002` fix: PASS for a completely fresh database and PASS for a simulated legacy database stamped at `0001`; both reached revision `0002`, and the legacy schema gained `must_change_password` and `auth_version`.
- Post-localization `git diff --check`: PASS. Static scans found no hardcoded Greek interface copy in `main.tsx` and no newly introduced deployment identifiers or credentials.
- Post-localization frontend build/Vitest: BLOCKED in this workspace because dependencies are absent and this execution sandbox cannot access the Docker socket. Rebuild verification is required before replacing the running web container.
- User-run production frontend image build after localization: PASS (`npm run build` completed in the Node build stage and image export succeeded).
- Safe-removal Python compilation and `git diff --check`: PASS. Runtime backend/frontend tests still require the user-accessible container environment.
- Version 2.4 hierarchy/theme/cascade implementation Python compilation and `git diff --check`: PASS. The subsequent user-run Docker build passed TypeScript/Vite production compilation and backend image assembly.
- User-run version 2.4 backend/web image build: PASS, including the frontend TypeScript/Vite production build.
- Production migration `0002 -> 0003`: PASS; `alembic current` reports `0003 (head)`, backend is healthy, and both the public homepage and `/api/health` return HTTP 200 with version `2.4.0` and expected security headers.
- Traefik discovery after container recreation briefly returned 404, then converged without configuration changes; inspection confirmed the intended external network and service port label.
- The pre-migration and first post-migration backup commands failed before executing due to pasted Python indentation; the corrected pipeline then created and verified `/data/voting-post-2.4.0.db` successfully. Both the live database and backup were 172 KB, and the backup is owned by the container application account.
- Version 2.4.0 commit/push was authorized, but this Codex sandbox could not create `.git/index.lock` because `.git` is mounted read-only. Repository sanitization and `git diff --check` passed; the host operator must run the documented Git commands.

## Unresolved/next steps

- On a network-enabled development host, install dependencies and run the exact commands in `TESTING.md`; correct any runtime or type-check issue they reveal.
- Run `docker compose build web` and the frontend test suite to validate the new bilingual UI before deployment; do not replace the running container until the build passes.
- Rebuild both images and validate migration `0003`, hierarchical creation, student management, countdowns, logo/background/theme persistence, and each cascading deletion level against disposable sample records before release.
- Generate and commit `frontend/package-lock.json` with the pinned manifest on a network-enabled host, then change CI/Docker builds to `npm ci` for fully reproducible installs.
- Conduct the documented two-browser manual E2E/classroom-network check before production use.
- Known limitation: the current UI covers the primary workflow but some advanced administration (ownership transfer, simulated demo generation, raw import preview, course asset upload) is exposed through the documented OpenAPI endpoints rather than dedicated polished screens.
- Known limitation: in-memory WebSocket/rate-limit state assumes one backend process. Add Redis pub/sub/shared limiting before scaling horizontally.
- Security hardening before production: place the application behind HTTPS, rotate bootstrap credentials, review proxy log retention, and consider a stricter Content-Security-Policy at the reverse proxy.
- Refer to `TODO.md` for planned future work. DNS, TLS, migration `0003`, public health, and the post-migration backup are verified for the active 2.4.0 deployment.
