# Testing

```bash
cd backend && ../.venv/bin/pytest -q
cd frontend && npm test
cd frontend && npm run build
docker compose config
docker compose up --build -d
```

`docker compose config` does not require the external network to exist, but it does require non-secret placeholder values for every mandatory deployment variable. Starting production requires the configured external network and must wait for verified DNS.

Backend tests cover authentication/ownership, first-login replacement, administrator-only creation, password changes, lifecycle, issuance/locking, vote uniqueness, anonymization, calculations, live edits, session isolation, duplication, and uploads. The frontend test covers rating preservation. Manual E2E should include temporary-password restriction, reset-token revocation, two browser profiles, live edits, completion, reveal, and exports.

Deterministic fixtures use an isolated SQLite database. Do not point tests at production. SQLite concurrency is covered by constraints and transactional behavior; it is not a substitute for capacity testing on deployment hardware.

Before release, also perform secret and dependency scans, container vulnerability scanning, migration from a copy of the previous schema, CLI reset testing, malicious upload cases, security-header inspection, and backup restoration. Record real results and never report blocked checks as passed.

