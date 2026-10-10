# Agent Instructions & Project Constitution

## 1. Mandatory Approval Policy
- **Always ask for approval** from the user before executing or finalizing architectural changes, major refactorings, or modifications to core grading workflows.

## 2. Bilingual Rule (Greek & English)
- **Every time UI text, labels, messages, or options are updated, BOTH languages MUST be updated simultaneously.**
- The application supports Greek (`el`) and English (`en`) via `src/i18n.ts`.
- Every translation key in `el` must have an exact, high-quality corresponding translation in `en`.
- Server errors returned to the client must map to bilingual error translations via `translateError` and `apiMessages`.

## 3. Strict 250-Line File Limit
- **No file in the repository may exceed 250 lines of code.**
- Decompose complex pages into focused components (e.g., `AdminForms.tsx`, `AdminRemovalPanel.tsx`).
- Decompose complex backend routes into dedicated routers (e.g., `sessionRoutes.ts`, `presentationRoutes.ts`, `publicRoutes.ts`, `exportRoutes.ts`).

## 4. GitHub Pull & Production Server Compatibility
- The application must run reliably when pulled from GitHub (`git pull`) on the production server configured through the ignored `.env` file.
- **Data Persistence**:
  - Database records are persisted in `data/db.json` with atomic writes.
  - Uploaded logos and backgrounds are stored in `data/assets/`.
  - The `data/` folder is preserved in `.gitignore` so `git pull` will never wipe or conflict with live production session and vote data.
- **Port & Environment**:
  - The server must read `process.env.PORT` with fallback to `3000`.
  - Scripts available: `npm run build`, `npm run serve`, `npm start`, and `./deploy.sh`.
  - Docker support: `Dockerfile` and `docker-compose.yml` are maintained and tested.

## 5. Development Mode & Authentication
- Default administrator credentials for testing are `admin` / `admin`.
- In development mode (`import.meta.env.DEV` / `NODE_ENV !== 'production'`), **never force mandatory password changes**.
- Allow seamless navigation across Dashboard, Sessions, Projector, and Admin panels during development.

## 6. Peer Grading Workflow Requirements
- **Session QR Code**: Generates one QR Code per session for quick student device onboarding.
- **Presenter Evaluation Screen**:
  - Displays presenter name and topic clearly.
  - Presents weighted grading categories.
  - Offers dual input modes: 1–5 quick buttons and dropdown selector.
  - Features real-time countdown timer with synchronized status alerts.
