# TODO

Planned work listed here is not represented as complete.

## Account recovery

- Design email recovery with verified addresses, single-use hashed tokens, short expiry, rate limiting, revocation, audit events, and non-enumerating responses.
- Select an institutional SMTP relay without committing credentials.
- Define administrator procedures for email changes and compromised accounts.
- Notify users of password resets and other security-sensitive changes.

## Release validation

- Generate and commit a root `package-lock.json` on a trusted network-enabled host; switch CI and Docker to `npm ci`.
- Add automated API, authorization, persistence, voting, WebSocket, upload, and responsive UI tests for the replacement Node application.
- Run TypeScript/build checks, browser E2E, image builds, dependency audits, and container scans.
- Test first-login enforcement and `npm run reset-password -- USERNAME` with a disposable data directory while the server is stopped.
- Verify DNS, TLS, headers, WebSockets, QR reachability, and restore procedures before deployment.
- Evaluate whether previously published deployment metadata warrants a coordinated Git history rewrite; do not force-push without explicit approval.

## Product and operations

- Add polished UI for ownership transfer, demo reset/generation, import mapping, course assets, and administrator password resets.
- Extend localization to administrator-defined content and exported workbook headings if bilingual exports become a requirement.
- Add credential-free audit events for account administration and resets.
- Define retention policies for sessions, exports, backups, application logs, and proxy logs.
- Add PostgreSQL migration and Redis coordination before horizontal scaling.
- Replace the single-writer JSON persistence layer with transactional storage before expanding beyond the small deployment.
- Perform keyboard, screen-reader, contrast, and reduced-motion accessibility testing.
- Add Playwright visual regression coverage for the documented phone/tablet viewport matrix once browser dependencies are available.
- Refactor inherited source files that exceed the repository's 250-line maintenance limit without changing behavior.
