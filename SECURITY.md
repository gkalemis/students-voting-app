# Security policy

## Supported version

Security fixes are applied to the latest release on the default branch.

## Reporting a vulnerability

Do not disclose vulnerabilities, credentials, student information, voting data, or infrastructure details in a public issue. Use GitHub's private vulnerability reporting feature for this repository. Include affected versions, reproduction steps, impact, and a suggested mitigation when possible.

Do not test against the production service or real classroom sessions without explicit authorization. Use a local installation with synthetic data.

## Deployment responsibilities

Operators must generate unique secrets, use HTTPS, remove bootstrap credentials after initialization, restrict database and asset backups, update dependencies, and minimize reverse-proxy access-log retention. The application does not use IP addresses as participant identity, but proxy infrastructure may log them independently.

The web service emits a one-year HSTS policy with `includeSubDomains` after HTTPS termination at the reverse proxy. The preload directive is intentionally omitted; operators must not enable preload without reviewing every subdomain and accepting its long-lived consequences.

Temporary-password accounts are restricted until replacement. Password change/reset revokes existing JWTs. Only administrators create professors; authorized server operators may use the container reset command. Email recovery is not implemented.

## Data handling

Never publish real names, exports, databases, branding assets, logs, tokens, or credentials. Use synthetic fixtures. Protect volumes and backups; anonymous voting reduces linkability but presenter names and detailed scores may remain sensitive educational records.

## Known boundaries

Bearer tokens use browser local storage, making Content Security Policy and dependency integrity important. Login/vote throttles and WebSocket state are process-local; horizontal deployments require shared coordination. SQLite targets the documented small deployment. See `TODO.md`.

