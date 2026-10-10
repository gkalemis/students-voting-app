# Student Presentation Voting 2.4

Self-hosted bilingual Greek–English classroom voting for multiple lecturers and concurrent sessions. It includes anonymous six-hour participant credentials, editable votes, weighted criteria, live presenter updates, early completion and anonymization, CSV/XLSX imports and exports, demo flags, duplication, projector mode, and global/course branding.

Only administrators can create or manage professor accounts. Bootstrap, new, and reset accounts must replace their temporary password under **Λογαριασμός** before using application features. Password changes and resets revoke older login tokens.

## Configuration & Quick Start with Docker

Before running the application, you must create a `.env` file based on `.env.example` and fill in your custom passwords, secret keys, port, and public URLs.

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```
2. Edit `.env` and set secure values for:
   - `ADMIN_USERNAME` and `ADMIN_PASSWORD` (initial administrator credentials)
   - `SECRET_KEY` (a secure random string for JWT authentication)
   - `PORT` (server port, default 3000)
   - `PUBLIC_BASE_URL` (your deployment URL)
3. Build and start the container stack:
   ```bash
   docker compose up --build -d
   ```

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

The REST/OpenAPI interface is at `/docs` on the backend in development. The UI supports Greek and English on every route. The selected language is stored only in the browser, and all interface copy is maintained in `frontend/src/i18n.ts`.

## Production behind an existing Traefik

The single `compose.yaml` connects the web service to the external network named by `TRAEFIK_NETWORK`, where an already-running Traefik container discovers it through environment-driven labels. It neither creates nor modifies Traefik.

```bash
docker compose up --build -d
```

No application port is published directly on the host. All domain, network, router, entrypoint, and resolver identifiers belong only in the ignored deployment `.env`. Verify DNS before deployment.

## Classroom workflow

An administrator creates lecturers. Each lecturer manages their own hierarchy: academic period → course → group → students. A group has one presentation date, which its voting session uses automatically. The lecturer activates the session and opens the projector route; students scan its permanent QR URL. During voting, participant and projector screens show the student, presentation subject, and remaining time.

Administrators can upload a global raster logo, choose a subtle background color, deactivate accounts, or permanently delete any account or hierarchy level. Permanent deletion cascades through everything below the selected item. Each authenticated user can select one of ten muted interface colors; this preference is stored with their account.

Campus Wi-Fi client isolation and firewalls can prevent phones reaching a local host. Use a reachable private server/HTTPS or ask network administration to permit the configured port. See [DEPLOYMENT.md](DEPLOYMENT.md).

## Security summary

Passwords use Argon2id; authenticated APIs enforce roles and ownership; participant credentials are random and only SHA-256 hashes are stored; vote uniqueness is a database constraint; completion transactionally converts scores to anonymous records and deletes token-linked votes. Uploaded images are decoded and restricted to PNG/JPEG/WebP (SVG deliberately rejected). The app neither fingerprints devices nor uses IP addresses as voting identity.

Production also uses trusted-host validation, exact CORS origins, strict browser response headers, upload expansion/dimension limits, and password-version session revocation. Review [SECURITY.md](SECURITY.md) before operation.

## Open-source project

Licensed under the [MIT License](LICENSE). See [CONTRIBUTING.md](CONTRIBUTING.md) before submitting changes and [SECURITY.md](SECURITY.md) for private vulnerability reporting. Never publish real student data, production exports, `.env` files, databases, or institutional assets.

