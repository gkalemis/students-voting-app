# TODO

Planned work listed here is not represented as complete.

## Account recovery

- Design email recovery with verified addresses, single-use hashed tokens, short expiry, rate limiting, revocation, audit events, and non-enumerating responses.
- Select an institutional SMTP relay without committing credentials.
- Define administrator procedures for email changes and compromised accounts.
- Notify users of password resets and other security-sensitive changes.

## Release validation

- Generate and commit `frontend/package-lock.json` on a trusted network-enabled host; switch CI and Docker to `npm ci`.
- Run pytest, Vitest/build, browser E2E, migration-from-v2.2, image builds, dependency audits, and container scans.
- Test first-login enforcement and `python -m app.cli reset-password USERNAME` with a disposable database.
- Verify DNS, TLS, headers, WebSockets, QR reachability, and restore procedures before deployment.
- Evaluate whether previously published deployment metadata warrants a coordinated Git history rewrite; do not force-push without explicit approval.

## Product and operations

- Add polished UI for ownership transfer, demo reset/generation, import mapping, course assets, and administrator password resets.
- Introduce localization catalogs before English translation.
- Add credential-free audit events for account administration and resets.
- Define retention policies for sessions, exports, backups, application logs, and proxy logs.
- Add PostgreSQL migration and Redis coordination before horizontal scaling.
- Perform keyboard, screen-reader, contrast, and reduced-motion accessibility testing.
