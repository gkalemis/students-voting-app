# Administrator guide

Set unique bootstrap credentials in the ignored `.env`, start only after DNS/TLS are ready, sign in, and replace the temporary password before any other action. Remove `ADMIN_PASSWORD` from the container environment after bootstrap. Only administrators create professor accounts; every new user must replace the temporary password.

Reset an administrator or professor from the server with:

```bash
docker compose exec backend python -m app.cli reset-password USERNAME
```

The password is printed once, existing sessions are revoked, and the account is restricted until it is replaced. Never pass passwords as command arguments or paste them into tickets. Email recovery is deferred in `TODO.md`.

Logo uploads accept decoded PNG, JPEG or WebP up to 5 MB and 25 megapixels. SVG is rejected. XLSX imports enforce compressed and expanded limits.

Administrators may access all owner-scoped API resources and can change roles/ownership through the documented API. Deactivate accounts rather than deleting audit principals. The presenter history endpoint is visible only to the session owner or administrator.

Back up the `voting-data` Docker volume while application writes are quiesced. Include both `voting.db` and `assets/`. Restore them together with the same permissions. Infrastructure proxy access logs may contain IP addresses; configure minimal retention at nginx/Traefik separately—the voting database stores none.

Review accounts each semester, deactivate unused accounts, rotate secrets, apply updates, and test restoration. Never commit `.env`, databases, exports, backups, assets, or real student information.

