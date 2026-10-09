# Student Presentation Voting 2.3

Self-hosted Greek-first classroom voting for multiple lecturers and concurrent sessions. It includes anonymous six-hour participant credentials, editable votes, weighted criteria, live presenter updates, early completion and anonymization, CSV/XLSX imports and exports, demo flags, duplication, projector mode, and global/course branding.

Only administrators can create or manage professor accounts. Bootstrap, new, and reset accounts must replace their temporary password under **Λογαριασμός** before using application features. Password changes and resets revoke older login tokens.

## Quick start with Docker

```bash
cp .env.example .env
# Replace SECRET_KEY, ADMIN_PASSWORD and PUBLIC_BASE_URL
docker compose up --build -d
```

Open the configured `PUBLIC_BASE_URL`. The bootstrap administrator is created only when the username does not exist and must replace the bootstrap password immediately. Then remove `ADMIN_PASSWORD` from the runtime environment; never commit `.env`.

An authorized server operator can reset any account without placing a password in shell history:

```bash
docker compose exec backend python -m app.cli reset-password USERNAME
```

The random temporary password is printed once and must be delivered privately.

## Development

```bash
python3 -m venv .venv
.venv/bin/pip install -r backend/requirements.txt
cd backend && ../.venv/bin/alembic upgrade head
../.venv/bin/uvicorn app.main:app --reload
# second terminal
cd frontend && npm install && npm run dev
```

The REST/OpenAPI interface is at `/docs` on the backend in development. UI language is Greek and all frontend copy is centralized in React components so an i18n catalog can be introduced without API changes.

## Production behind an existing Traefik

The single `compose.yaml` connects the web service to the external network named by `TRAEFIK_NETWORK`, where an already-running Traefik container discovers it through environment-driven labels. It neither creates nor modifies Traefik.

```bash
docker compose up --build -d
```

No application port is published directly on the host. All domain, network, router, entrypoint, and resolver identifiers belong only in the ignored deployment `.env`. Verify DNS before deployment.

## Classroom workflow

An administrator creates lecturers. A lecturer creates a course, period and group, imports presenters (CSV/XLSX), creates and activates a session, then opens the projector route. Students scan its permanent QR URL. The lecturer may select any pending presenter, edit presenter details live, open/close voting, skip absences, complete early, separately reveal results, export, or duplicate the configuration.

Campus Wi-Fi client isolation and firewalls can prevent phones reaching a local host. Use a reachable private server/HTTPS or ask network administration to permit the configured port. See [DEPLOYMENT.md](DEPLOYMENT.md).

## Security summary

Passwords use Argon2id; authenticated APIs enforce roles and ownership; participant credentials are random and only SHA-256 hashes are stored; vote uniqueness is a database constraint; completion transactionally converts scores to anonymous records and deletes token-linked votes. Uploaded images are decoded and restricted to PNG/JPEG/WebP (SVG deliberately rejected). The app neither fingerprints devices nor uses IP addresses as voting identity.

Production also uses trusted-host validation, exact CORS origins, strict browser response headers, upload expansion/dimension limits, and password-version session revocation. Review [SECURITY.md](SECURITY.md) before operation.

## Open-source project

Licensed under the [MIT License](LICENSE). See [CONTRIBUTING.md](CONTRIBUTING.md) before submitting changes and [SECURITY.md](SECURITY.md) for private vulnerability reporting. Never publish real student data, production exports, `.env` files, databases, or institutional assets.

