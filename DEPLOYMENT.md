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

First preview GitHub changes without pulling or deploying:

```bash
./deploy.sh --check
```

The script requires a clean Git working tree and fetches the current branch's configured upstream. If local source is behind, it shows incoming commits, a change summary and file paths. Review the full diff with `git diff HEAD..origin/main`. Run `./deploy.sh` and type `yes` to accept the displayed changes: it archives the current committed source under `backups/pre-pull-*`, fast-forwards to the exact reviewed commit, and restarts the updated script. It refuses local changes, unpushed commits and diverged branches without discarding anything. It never pushes Git.

The upstream is the reviewed production repository (`origin`), not the separate AI Studio repository. AI Studio changes must first be integrated and tested before reaching production `main`; this script does not merge raw AI Studio output. Fast-forward eligibility does not verify security or application correctness.

After synchronization, it validates Compose, builds using the committed lockfile before downtime, creates and validates a private timestamped data backup, recreates only `voting-app`, waits for health, verifies public HTTPS/security headers, and confirms that port 3000 is not published. If deployment fails after stopping the service, including a failed validation, it retags and recreates the previous image automatically. Image rollback does not restore data; schema-changing releases need a separately reviewed data rollback procedure.

Commit and push the currently integrated local changes before using this workflow; an uncommitted working tree stops the script before fetching or deployment.

`data-init` exiting with code 0 is expected. It prepares the bind-mounted data directory for the non-root application UID. Do not run multiple application or CLI writers against `data/db.json` concurrently.

## Backup and update

Stop the application briefly and archive the entire `data/` directory, including assets. Restore it as one unit. Before an update, test the backup, pull the reviewed commit, build, and recreate the service. Do not use floating image tags or automatic unattended application updates.
