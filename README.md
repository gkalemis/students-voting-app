# Student Presentation Voting

Self-hosted bilingual Greek–English classroom presentation voting. Lecturers manage a period → course → group → student hierarchy, run timed voting sessions, and view results. Only administrators manage lecturer accounts.

## Production deployment

The application is a single Node/Express container serving the React/Vite interface and API. The included `docker-compose.yml` connects it to an existing Traefik Docker network; it does not install or modify Traefik and publishes no host port.

```bash
cp .env.example .env
# Populate every value; never commit .env.
docker compose config --quiet
docker compose up --build -d
```

Generate `SECRET_KEY` with `openssl rand -hex 32`. `PUBLIC_BASE_URL` must be the complete HTTPS URL. `ALLOWED_HOSTS` is comma-separated and must include the public hostname and `127.0.0.1` for the container health check. All Traefik identifiers belong only in `.env`.

On a fresh installation, `ADMIN_PASSWORD` creates the administrator as a temporary credential. On an installation containing the historical default administrator password, it securely replaces that password. Log in, change it immediately, then remove `ADMIN_PASSWORD` from `.env` and recreate the container.

To reset an account, stop the application first so two processes cannot write the JSON data file simultaneously:

```bash
docker compose stop voting-app
docker compose run --rm voting-app npm run reset-password -- USERNAME
docker compose up -d voting-app
```

The command prints a random temporary password once. The account must change it on first login, and older tokens are revoked.

## Development

```bash
npm install
npm run dev
```

Development defaults are intentionally local-only. Production refuses to start without a long secret, administrator username, public URL, and host allowlist.

## Security and privacy

Passwords use bcrypt. Protected routes enforce roles and ownership; participant tokens are random and vote completion removes token-linked records. Production enables a host allowlist and browser security headers. Uploaded branding is restricted to validated PNG, JPEG, or WebP files.

Do not publish `.env`, `data/`, exports, logs, real names, institutional assets, or infrastructure details. Review [SECURITY.md](SECURITY.md), [DEPLOYMENT.md](DEPLOYMENT.md), and [TESTING.md](TESTING.md) before classroom use.

Licensed under the [MIT License](LICENSE).
