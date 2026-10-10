# Architecture

The current application is a React/Vite SPA and Express API in one Node process and container. Express serves the compiled frontend, REST API, WebSocket endpoint, and validated branding assets on port 3000. An existing Traefik instance terminates HTTPS and discovers the service through Compose labels.

## Persistence and ownership

Application state is persisted atomically to the bind-mounted `data/db.json`; uploaded assets live below `data/assets`. The hierarchy is period → course → group → students, and records carry owner IDs. Administrators manage lecturer accounts and all data; lecturers manage their own hierarchy and sessions.

Because persistence is one JSON file, exactly one application or maintenance writer may run at a time. This design is appropriate only for the current small installation. PostgreSQL transactions, schema migrations, and shared real-time/rate-limit coordination are required before horizontal scaling or materially larger use.

## Authentication and voting

Passwords are bcrypt hashes. JWTs contain an authentication version; password changes and resets increment it to revoke existing tokens. New, bootstrap, and reset accounts must change their temporary password before normal application use. There is no production password bypass.

Participant credentials are random and session-scoped. Votes are editable during the open window. Completion converts voting records to anonymous score rows and removes token-linked votes. WebSocket events prompt clients to refresh authoritative state.

## Security boundaries

Production configuration is read from ignored `.env` values and validated at startup. Express enforces a host allowlist, request-size limit, role middleware, security headers, and production HSTS. Branding uploads use size, MIME, and file-signature checks and randomized filenames. The container runs as UID 10001 with `no-new-privileges`; no application port is published directly.

The Docker socket is not mounted into the application. Traefik configuration remains owned by the existing reverse-proxy deployment.
