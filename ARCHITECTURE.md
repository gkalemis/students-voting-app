# Architecture

The React/Vite SPA is served by nginx, which proxies REST, WebSocket, and asset traffic to FastAPI. SQLAlchemy uses a normalized SQLite database with foreign keys, WAL mode and a 30-second busy timeout. Alembic owns schema evolution. Persistent `/data` contains the database and validated branding assets.

## Data and authorization

Users own courses, periods, groups and sessions. Every protected object lookup applies owner-or-admin authorization, returning 404 to lecturers for foreign resources. A session has stable presentations, ordered criteria, tokens, votes/scores, anonymous scores, and presenter edit events. Presentation names/titles are labels only; votes reference immutable numeric IDs.

JWTs contain a per-user authentication version. Password changes and resets increment it, invalidating older tokens. New/bootstrap/reset accounts carry `must_change_password`; only identity inspection and password replacement remain available until it is cleared. Only administrators create accounts; server operators can invoke identical reset semantics through the container CLI.

Session state flows `DRAFT → ACTIVE → COMPLETED → ARCHIVED`; presentation state flows `PENDING → VOTING_OPEN → EVALUATED|NO_VOTES`, with reversible `PENDING ↔ SKIPPED` before completion. Only one open presentation is permitted per session, while session-scoped queries/channels allow independent concurrent sessions.

## Tokens, voting and anonymity

A browser stores `{token, expires_at}` under a session-specific localStorage key. Issuance never extends an existing credential and expiry is fixed at six hours. Admission locking blocks issuance only. A scheduler removes expired credentials every 15 minutes by default. Server time and state are authoritative. The unique `(presentation_id, token_id)` constraint makes edits an upsert rather than an additional vote.

Completion closes the window, marks remaining presenters skipped, copies each vote's criterion records under a new random anonymous vote ID, deletes token-linked votes, deletes session tokens, and commits together. Anonymous records intentionally omit timestamps, network information and browser identifiers while retaining enough grouping for reproducible aggregates.

## Realtime and branding

Each public session ID has an isolated WebSocket connection set. Messages contain event types only; clients refetch authoritative state after every message or reconnect. This avoids exposing administrative data and preserves form component state when presenter labels change. Global branding is the default; non-empty course fields overlay it. QR codes always render in a separate solid-white container.

SQLite is appropriate for the expected six lecturers/roughly 90 students, but serializes writes. For materially larger workloads, change `DATABASE_URL` to PostgreSQL, add its driver, run migrations, and use a shared pub/sub broker if multiple backend processes are introduced.

Security boundaries include nginx request limits and headers, exact origin/host checks, Pydantic validation, ORM parameterization, randomized decoded raster assets, XLSX expansion limits, and credential-scoped throttles. In-memory throttles and WebSockets must move to shared infrastructure before horizontal scaling.

