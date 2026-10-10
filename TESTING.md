# Testing

## Automated checks

```bash
npm install
npm run lint
npm run build
docker compose config --quiet
```

GitHub Actions runs these checks for pushes and pull requests. Dependabot monitors root npm, Docker, and workflow dependencies. A committed lockfile is still required before changing installation commands to `npm ci`.

## Container smoke test

Use synthetic data and a non-production environment. After a successful build, confirm the health endpoint, startup logs, non-root user, lack of a published host port, Traefik network attachment, and persistence across restart.

## Manual acceptance

Test both languages and widths 320, 375, 430, 768, 820, and 1024 pixels. Cover:

- bootstrap login and mandatory password change;
- administrator lecturer creation, reset, deactivation, and deletion;
- lecturer ownership and period → course → group → student operations;
- session activation, QR admission, voting edits, countdown, auto-close, and completion;
- two independent browser profiles and concurrent sessions;
- logo upload rejection/acceptance and persistence;
- direct-host rejection, HTTPS headers, WebSockets, and logout/token revocation;
- backup and restore of the complete `data/` directory.

Do not claim a check passed when it was blocked. Never run destructive or load tests against real classroom data.
