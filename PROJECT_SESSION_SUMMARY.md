# Project session summary

Last updated: 2026-10-09

Current release candidate: 2.3.0

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
- Test suite authored: 5 integrated backend scenarios plus 1 frontend state-preservation test. These could not be executed here for the dependency reasons below.
- Backend pytest: BLOCKED in this workspace. `pip install -r backend/requirements.txt` could not reach the package index and FastAPI/SQLAlchemy/Pydantic are not preinstalled.
- Frontend Vitest/build: BLOCKED in this workspace. `npm install --prefer-offline` could not resolve dependencies from a local cache and network access is unavailable.
- Docker image build/runtime smoke test: BLOCKED because this execution user cannot access `/var/run/docker.sock` and required base images are not locally inspectable.

## Unresolved/next steps

- On a network-enabled development host, install dependencies and run the exact commands in `TESTING.md`; correct any runtime or type-check issue they reveal.
- Generate and commit `frontend/package-lock.json` with the pinned manifest on a network-enabled host, then change CI/Docker builds to `npm ci` for fully reproducible installs.
- Conduct the documented two-browser manual E2E/classroom-network check before production use.
- Known limitation: the current UI covers the primary workflow but some advanced administration (ownership transfer, simulated demo generation, raw import preview, course asset upload) is exposed through the documented OpenAPI endpoints rather than dedicated polished screens.
- Known limitation: in-memory WebSocket/rate-limit state assumes one backend process. Add Redis pub/sub/shared limiting before scaling horizontally.
- Security hardening before production: place the application behind HTTPS, rotate bootstrap credentials, review proxy log retention, and consider a stricter Content-Security-Policy at the reverse proxy.
- Refer to `TODO.md` for all planned future work. DNS is not yet verified and deployment remains explicitly prohibited.
