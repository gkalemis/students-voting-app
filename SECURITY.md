# Security policy

## Supported version

Security fixes are applied to the latest release on the default branch.

## Reporting a vulnerability

Do not disclose vulnerabilities, credentials, student information, voting data, or infrastructure details in a public issue. Use GitHub's private vulnerability reporting feature for this repository. Include affected versions, reproduction steps, impact, and a suggested mitigation when possible.

Do not test against the production service or real classroom sessions without explicit authorization. Use a local installation with synthetic data.

## Deployment responsibilities

Operators must generate unique secrets, use HTTPS, remove bootstrap credentials after initialization, restrict database and asset backups, update dependencies, and minimize reverse-proxy access-log retention. The application does not use IP addresses as participant identity, but proxy infrastructure may log them independently.

