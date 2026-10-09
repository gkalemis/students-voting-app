# Testing

```bash
cd backend && ../.venv/bin/pytest -q
cd frontend && npm test
cd frontend && npm run build
docker compose config
docker compose up --build -d
```

`docker compose config` does not require the external network to exist. Starting the production stack requires the existing Atlas `frontend` network.

Backend tests cover authentication/ownership, lifecycle, issuance and admission locking, vote edit uniqueness, completion anonymization, result calculation, live presenter audit preservation, concurrent-session isolation, duplication and upload validation. The frontend unit test asserts rating state remains independent of presenter label changes. Manual E2E: use two browser profiles, join from the QR URL, open voting, vote/edit, change the title live, close, skip another presenter, complete/reveal, and inspect both exports.

Deterministic fixtures use an isolated SQLite database. Do not point tests at production. SQLite concurrency is covered by constraints and transactional behavior; it is not a substitute for capacity testing on deployment hardware.

