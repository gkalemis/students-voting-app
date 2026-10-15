# Testing

## Automated checks

```bash
npm ci
npm run lint
npm run build
docker compose config --quiet
```

GitHub Actions runs these checks for pushes and pull requests. Dependabot monitors root npm, Docker, and workflow dependencies. `package-lock.json` fixes resolved versions; Docker and CI use `npm ci`. Commit the manifest and lockfile together when updating dependencies.

The 2026-10-15 major upgrade passed host and Docker builds with Express 5.3, bcryptjs 3.0, Multer 2.4, Vite 8.3, React plugin 6.1 and TypeScript 7.0. Isolated disposable-container checks covered production startup, root and SPA deep links, login/password replacement, accepted/rejected uploads, sample import, resource ownership, and demo authorization/timers. Browser acceptance remains a separate deployment check.

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
