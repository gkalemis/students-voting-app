# Testing

## Automated checks

```bash
npm ci
npm run lint
npm run build
npm run test:smoke
docker compose config --quiet
```

GitHub Actions runs these checks for pushes and pull requests. Dependabot monitors root npm, Docker, and workflow dependencies. `package-lock.json` fixes resolved versions; Docker and CI use `npm ci`. Commit the manifest and lockfile together when updating dependencies.

The 2026-10-15 major upgrade passed host and Docker builds with Express 5.3, bcryptjs 3.0, Multer 2.4, Vite 8.3, React plugin 6.1 and TypeScript 7.0. Isolated disposable-container checks covered production startup, root and SPA deep links, login/password replacement, accepted/rejected uploads, sample import, resource ownership, and demo authorization/timers. Browser acceptance remains a separate deployment check.

## Container smoke test

`npm run test:smoke` creates a disposable data directory under the system temporary folder and never mounts production data. It verifies login credential hints stay absent, the administrator demo toggle is validated/persisted, disabled demo insertion is rejected, CSV aliases enforce group ownership, results require explicit reveal, archiving works, and real participation remains available with demos disabled. Integration exceptions for future imports are recorded in `AISTUDIO_IMPORT.md`.

Use synthetic data and a non-production environment. After a successful build, confirm the health endpoint, startup logs, non-root user, lack of a published host port, Traefik network attachment, and persistence across restart.

The v3 smoke suite additionally covers quiz lifecycle, signed answers, result privacy, WebSocket synchronization/origin checks, first-login restrictions, cookie CSRF, validated backup/restore and token revocation. It uses disposable synthetic data only.

After building the application image, test actual production startup and restart persistence without networking or production mounts:

```bash
docker run --rm --network none --tmpfs /app/data:uid=10001,gid=10001 \
  --mount "type=bind,src=$PWD/tests/runtime-smoke.mjs,dst=/app/runtime-smoke.mjs,readonly" \
  student-presentation-voting-voting-app node /app/runtime-smoke.mjs
```

Check runtime advisories separately with `npm audit --omit=dev`. The 2026-11-18 integration has zero runtime advisories; five high development dependency reports derive from the unpatched picomatch advisory GHSA-fc5q-39xc-vjpf. Do not apply the suggested incompatible Vite downgrade automatically.

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
