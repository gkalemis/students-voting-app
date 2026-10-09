# Changelog

## 2.2.0

- Combined complete v2.0 application foundation with multi-lecturer authorization, courses/groups/periods/sessions, imports, voting, anonymized ranking, exports, projector and Docker deployment.
- Added isolated concurrent session WebSockets and stable presentation identities.
- Added live presenter name/title editing with private audit history and vote preservation.
- Added persistent global and course-level institutional branding, safe raster uploads, preview, subtle backgrounds and Excel identity headers.
- Added automated lifecycle, isolation, security and branding tests.
- Prepared the repository for public GitHub use with an MIT license, contributor/security guidance, issue and pull-request templates, Dependabot, and CI.
- Added a self-service password-change screen while retaining administrator-only professor creation.
- Added the production Traefik configuration for `ntua-civil-voting.kfm.gr`.
- Consolidated the existing Atlas Traefik integration into the single `compose.yaml`; no separate override or direct host port is used.

