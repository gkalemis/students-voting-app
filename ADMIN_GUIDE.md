# Administrator guide

Set bootstrap credentials in `.env`, start the service, sign in, and immediately use a strong unique password. The Administration page creates/deactivates lecturers and configures the global university, school, department and background. Logo uploads accept decoded PNG, JPEG or WebP up to 5 MB; SVG is rejected because safe sanitization is not bundled.

Administrators may access all owner-scoped API resources and can change roles/ownership through the documented API. Deactivate accounts rather than deleting audit principals. The presenter history endpoint is visible only to the session owner or administrator.

Back up the `voting-data` Docker volume while application writes are quiesced. Include both `voting.db` and `assets/`. Restore them together with the same permissions. Infrastructure proxy access logs may contain IP addresses; configure minimal retention at nginx/Traefik separately—the voting database stores none.

