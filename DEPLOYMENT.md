# Deployment

## Preconditions

- DNS resolves to the deployment host.
- An existing Traefik container has Docker discovery, HTTPS entrypoint, certificate resolver, and an external Docker network.
- `.env` contains unique secrets and deployment-specific identifiers.
- `data/` has a protected, tested backup.

The Compose stack does not create or change Traefik. It attaches only `voting-app` to Traefik's external network and does not expose port 3000 on the host.

## Environment

Copy `.env.example` to `.env` and populate every field. Keep `.env` mode `0600` and never commit it.

- `SECRET_KEY`: output of `openssl rand -hex 32` or stronger.
- `ADMIN_USERNAME`: initial administrator username.
- `ADMIN_PASSWORD`: strong temporary bootstrap/recovery password; remove after it is changed.
- `PUBLIC_BASE_URL`: full externally reachable HTTPS origin, without a trailing slash.
- `ALLOWED_HOSTS`: comma-separated public hostname plus `127.0.0.1` for health checks.
- `TRAEFIK_*`: values matching the existing Traefik installation.

Validate without printing expanded secrets:

```bash
chmod 600 .env
docker compose config --quiet
docker network inspect "$(sed -n 's/^TRAEFIK_NETWORK=//p' .env)" >/dev/null
```

## Start and verify

Back up `data/`, then:

```bash
docker compose up --build -d
docker compose ps
docker compose logs --no-color --tail=100 voting-app
```

Verify the configured public `/api/health`, UI, TLS certificate, HSTS and Content Security Policy. Test login, first-password change, WebSockets, QR participation, voting, and persistence across a controlled restart.

For routine reviewed deployments, use the one-step operator script:

```bash
./deploy.sh
```

It requires a clean Git working tree, fetches the configured upstream, and deploys only when local `HEAD` exactly matches that upstream. When GitHub differs, it prints the relevant commits and changed paths and stops before Docker activity; review and run `git pull --ff-only` manually. It then validates Compose, builds before downtime, creates and validates a private timestamped data backup, recreates only `voting-app`, waits for health, verifies public HTTPS/security headers, and confirms that port 3000 is not published. It never pulls or pushes Git. If deployment fails after stopping the service, it retags and recreates the previous image automatically.

`data-init` exiting with code 0 is expected. It prepares the bind-mounted data directory for the non-root application UID. Do not run multiple application or CLI writers against `data/db.json` concurrently.

## Backup and update

Stop the application briefly and archive the entire `data/` directory, including assets. Restore it as one unit. Before an update, test the backup, pull the reviewed commit, build, and recreate the service. Do not use floating image tags or automatic unattended application updates.
