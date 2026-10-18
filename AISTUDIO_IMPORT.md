# AI Studio import rules

These production integration rules apply to every import until the owner explicitly changes them. AI Studio may continue to produce code that conflicts with these rules; reapply the production rules during each import.

- Import application features from `gkalemis/students-voting-app-aistudio` using a three-way comparison against the last imported commit. Keep local security and deployment fixes.
- Never display test credentials or credential-autofill buttons on the opening/login screen, regardless of demo settings. Do not recreate default testing accounts or password bypasses.
- Keep the administrator's demo toggle. It controls sample/demo data insertion and the demo student voting preview, not authentication or real student voting.
- Persist and validate demo settings on the server. Disabled demo settings must prevent insertion through both sample-fixture and demo-session APIs, including administrator requests. Normal classroom data and real student voting must remain available.
- Preserve ownership validation for every import, edit and presentation action. Do not replace hardened authentication, upload validation, WebSocket validation, environment configuration, bind mounts, container names or Traefik labels with upstream equivalents.
- Keep the npm lockfile synchronized with the manifest, preserve supported runtime/type compatibility and use `npm ci`. Importing an upstream version bump must not downgrade already-reviewed dependencies.
- Keep local operational documentation and handoff records rather than overwriting them with upstream copies. Review upstream changelog claims against actual local behavior.
- Do not run upstream startup migrations that rename or reweight historical grading criteria. New defaults apply to new sessions; preserve existing names, weights and meaning when displaying/translating historical criteria.
- Back up source before integration. Run lint/build, isolated authorization/demo tests, and login-screen checks before reporting completion. Deploy, commit and push only when requested.

Last integrated application baseline: `4bdb095` (AI Studio v2.8.1), 2026-10-18.
