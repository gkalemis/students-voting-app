# Deployment

## Preconditions

- DNS for the private `TRAEFIK_HOST` value verified against the deployment host.
- Existing Traefik with the configured entrypoint, Docker discovery, certificate resolver, and external network.
- Unique `SECRET_KEY` and bootstrap password in an untracked `.env`.
- Protected database/asset backup destination and tested restore procedure.

Do not start the stack until DNS is verified.

## Docker deployment

Copy `.env.example`, generate secrets, and run `docker compose up --build -d` only after DNS is ready. Database/assets persist in `voting-data`; the web service is reachable only through the existing Traefik container.

## Traefik/private HTTPS

Set `PUBLIC_BASE_URL`, exact `ALLOWED_ORIGINS`, `ALLOWED_HOSTS`, `TRAEFIK_HOST`, `TRAEFIK_NETWORK`, `TRAEFIK_ROUTER_NAME`, `TRAEFIK_ENTRYPOINT`, and `TRAEFIK_CERTRESOLVER` only in the ignored deployment `.env`. The single `compose.yaml` consumes these values without revealing infrastructure metadata. It does not create or modify Traefik, and neither service publishes a host port.

Verify DNS through multiple public resolvers and confirm that the configured external network exists. For development without Traefik, use the backend and Vite commands in `README.md`.

## Updates and backup

Back up first, then `docker compose build --pull && docker compose up -d`; the backend runs `alembic upgrade head`. For backup, stop briefly and archive the named volume. Restore the database and asset directory together. Missing assets degrade to the neutral interface.

Troubleshooting: confirm `.env` values, `docker compose logs`, health status, phone-to-host routing, campus client isolation, firewall port, HTTPS mixed-content rules, and proxy WebSocket forwarding.

After bootstrap, replace the temporary administrator password, remove `ADMIN_PASSWORD` from `.env`, and recreate the backend. Validate HTTPS, headers, WebSockets, QR reachability, backup, and restore before classroom use.

