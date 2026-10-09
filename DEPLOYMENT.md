# Deployment

## Docker deployment

Copy `.env.example`, generate secrets, and run `docker compose up --build -d` after DNS is ready. Database/assets persist in `voting-data`, and WebSocket upgrades are included in nginx configuration. The production web service is reachable only through the existing Atlas Traefik container.

## Traefik/private HTTPS

The target is `https://ntua-civil-voting.kfm.gr`. Set `TRAEFIK_ENABLED=true`, `TRAEFIK_HOST=ntua-civil-voting.kfm.gr`, the HTTPS `PUBLIC_BASE_URL`, matching `ALLOWED_ORIGINS`, and the resolver used by the existing proxy. The single `compose.yaml` attaches `web` to the existing external `frontend` network and supplies Docker discovery labels; it does not create or modify Traefik. The labels expect a `websecure` entrypoint. Neither the backend nor web service publishes a host port.

Before deployment, create the DNS record and confirm that the `frontend` Docker network exists on Atlas. For local development without Atlas Traefik, run the backend and Vite development servers as documented in `README.md`.

## Updates and backup

Back up first, then `docker compose build --pull && docker compose up -d`; the backend runs `alembic upgrade head`. For backup, stop briefly and archive the named volume. Restore the database and asset directory together. Missing assets degrade to the neutral interface.

Troubleshooting: confirm `.env` values, `docker compose logs`, health status, phone-to-host routing, campus client isolation, firewall port, HTTPS mixed-content rules, and proxy WebSocket forwarding.

