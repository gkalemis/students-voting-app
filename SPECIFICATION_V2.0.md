# CODEX IMPLEMENTATION PROMPT
## Student Presentation Voting — Version 2.0
### Complete Application Development, Testing, Deployment and Documentation

You are acting as a senior full-stack software engineer, software architect, database designer, security engineer, and QA engineer.

Your task is to **design, implement, test, and document a complete, production-ready web application** named:

**Student Presentation Voting**

The application will allow university lecturers to organize student presentation sessions and let students evaluate presentations anonymously from their smartphones.

The application must be self-hosted, reusable across courses and academic semesters, and capable of operating either on a local network or on a private server.

**Do not stop after producing an architecture proposal or a development plan. Implement the actual working application.**

Work systematically, execute the available tests, fix problems, and deliver the complete source code and deployment configuration.

---

# 1. PRIMARY OBJECTIVES

The application must provide:

1. Multiple authenticated lecturer accounts.
2. A separate administrator role.
3. Courses, academic periods, student groups, and presentation sessions.
4. Student import from CSV and Excel.
5. Configurable evaluation criteria and weights.
6. Anonymous student participation through a QR code.
7. Persistent browser participation tokens with a six-hour lifetime.
8. One stored vote per token per presentation.
9. Lecturer-controlled opening and closing of voting.
10. Real-time updates to connected smartphones.
11. Flexible selection of presenters regardless of their original order.
12. Skipping absent presenters.
13. Early completion of sessions.
14. Anonymous results, weighted scores, and rankings.
15. Test/demo sessions.
16. Session duplication without copying votes.
17. CSV and Excel exports.
18. Local and Docker-based server deployment.
19. Automated testing and documentation.

The application must not depend on third-party voting platforms or commercial APIs.

The default user interface language must be **Greek (el-GR)**.

Structure the frontend so that English localization can be added later without major refactoring.

---

# 2. TECHNOLOGY STACK

Use the following preferred technologies.

## Frontend

- React
- TypeScript
- Vite
- Responsive, mobile-first interface
- React Router
- A suitable component/styling approach
- Accessible forms and controls
- WebSocket-based real-time synchronization

## Backend

- Python
- FastAPI
- SQLAlchemy
- Pydantic
- Alembic database migrations
- WebSockets
- REST API

## Database

- SQLite for the initial deployment
- Persistent database storage
- Foreign keys and appropriate unique constraints
- Transactions for critical voting operations
- Database abstraction that allows future migration to PostgreSQL

## Deployment

- Docker
- Docker Compose
- Environment-based configuration
- Compatibility with an existing Traefik reverse proxy
- HTTPS support through the reverse proxy
- Local-network deployment without requiring a public domain

## Testing

- pytest
- Backend API and database tests
- Frontend tests
- End-to-end browser tests using Playwright or equivalent

You may introduce additional mature, well-maintained dependencies when justified.

Avoid unnecessary complexity, paid services, and external dependencies.

---

# 3. USER ROLES AND AUTHORIZATION

Implement three functional user categories.

## 3.1 Administrator

An administrator must be able to:

- Log in securely.
- Create lecturer accounts.
- Edit lecturer account details.
- Activate or deactivate accounts.
- Reset lecturer passwords.
- Assign or change user roles.
- View and manage all courses.
- View and manage all student groups.
- View and manage all presentation sessions.
- Transfer ownership of a course or session.
- Access system settings.
- View all results.
- Export all permitted data.
- Manage demo sessions.
- Change their own password.

Provide a secure initial administrator bootstrap mechanism using environment variables or a dedicated initialization command.

Do not hardcode administrator credentials.

Store passwords using Argon2id or another appropriate modern password-hashing algorithm.

Never store plaintext passwords.

## 3.2 Lecturer

A lecturer must be able to:

- Log in securely.
- Change their password.
- Create and manage their own courses.
- Create academic periods and student groups.
- Add and import students.
- Create presentation sessions.
- Configure criteria and weights.
- Choose the next presenter.
- Open and close voting.
- View participation counts.
- Skip presentations.
- Complete sessions early.
- Reveal results.
- Export results.
- Duplicate their own sessions.
- Create and run demo sessions.

A lecturer must not:

- Create administrator accounts.
- Manage other users.
- Access system-wide settings.
- Access another lecturer's private data.
- Modify sessions owned by another lecturer.

Each session must have exactly one owner.

The administrator can override ownership restrictions.

Enforce all authorization rules on the backend, not merely by hiding frontend controls.

Prevent insecure direct object reference vulnerabilities.

## 3.3 Student Participant

Students must not need accounts, usernames, passwords, email addresses, or student registration numbers.

Students access the voting interface by scanning the session QR code.

They receive an anonymous participation token and can vote while a presentation's voting window is open.

Students must not access administrative endpoints or unpublished results.

---

# 4. DATA ORGANIZATION

Implement the following logical hierarchy:

Course
→ Academic Period
→ Student Group
→ Presentation Session
→ Presentations
→ Votes and Results

Example:

Course: Scientific Methodology

Academic Period: Winter Semester 2026–2027

Group: Group C

Session Date: 21 October 2026

Scheduled Presentations: 15

## 4.1 Courses

A course must contain:

- Unique identifier
- Course name
- Optional description
- Owner
- Creation and modification timestamps

## 4.2 Academic Periods

Support configurable academic periods, for example:

- Winter Semester 2026–2027
- Spring Semester 2026–2027

Do not hardcode semester names or academic years.

## 4.3 Student Groups

Each group must have:

- Unique identifier
- Group title
- Course association
- Academic period association
- Owner
- Student/presenter list

A group can be reused in multiple presentation sessions.

## 4.4 Presentation Sessions

Each session must contain:

- Unique identifier
- Course
- Academic period
- Group
- Session date
- Optional title
- Owner
- Status
- Configured criteria
- Presentations
- Voting settings
- Participant admission settings
- Created and updated timestamps
- Completion timestamp, when applicable

Each session must have its own unique public participation URL and QR code.

Session data must remain isolated from other sessions.

---

# 5. STUDENT AND PRESENTATION MANAGEMENT

Lecturers must be able to create and edit student/presenter records manually.

They must also be able to import presenters from:

- CSV files
- Excel `.xlsx` files

Support UTF-8 and Greek characters correctly.

At minimum, recognize:

- Student full name — required
- Presentation title — optional

Example:

| Student Name | Presentation Title |
|---|---|
| Maria Papadopoulou | AI Applications in Bridge Design |
| Nikos Dimitriou | Seismic Risk Assessment |
| Eleni Georgiou | Algorithmic Decision-Making |

Provide:

- Downloadable CSV template
- Downloadable Excel template
- Import preview
- Column mapping when possible
- Validation of required fields
- Empty-row handling
- Duplicate-name warnings
- Clear error reporting
- Confirmation before committing an import

Duplicate names should generate warnings, not automatic deletion, because different students may legitimately share a name.

Do not require personal identifiers beyond the presenter's name.

The number of presentations must be configurable.

The initial expected use case is approximately 15 presentations per session, but the application must not impose a hardcoded limit of 15.

---

# 6. CONFIGURABLE EVALUATION CRITERIA

The lecturer must be able to configure the evaluation system separately for each session.

Allow:

- Adding criteria
- Removing criteria
- Renaming criteria
- Reordering criteria
- Configuring percentage weights

The total weight must equal 100%.

Reject invalid configurations before voting begins.

Default example:

1. Scientific Documentation and Accuracy — 50%
2. Clarity and Organization — 30%
3. Critical Thinking and Originality — 20%

These criteria are examples, not permanent system constraints.

The initial rating scale is 1–5.

Each criterion must receive an integer score from 1 to 5.

Every criterion must be scored before a vote can be submitted.

Use exact decimal or integer-based weight calculations to avoid floating-point inconsistencies.

Criteria and weights must become immutable once the first presentation voting window opens.

---

# 7. STUDENT ENTRY AND QR CODE

Every presentation session must have a stable public participation URL.

Generate a QR code encoding that URL.

The QR code must remain the same throughout the session.

Provide a dedicated **Projector View**.

The Projector View must show:

- Course name
- Academic period
- Group title
- Session date
- Current presenter
- Presentation title, when available
- Voting status
- Number of submitted votes for the active presentation
- Permanent QR code
- Human-readable participation URL

The QR code must remain visible throughout the session, including when no voting window is open.

The lecturer dashboard and Projector View must be separate interfaces.

The lecturer must be able to open the Projector View in a second browser window or on a projector.

Do not expose administrator controls or unpublished scores in the public Projector View.

The student must not need to scan a new QR code for each presentation.

---

# 8. PARTICIPATION TOKENS

Implement anonymous participation tokens with the following exact behavior.

## 8.1 Token Creation

On the first visit to a session participation URL:

1. Check for an existing valid token for that session.
2. Reuse the existing token when valid.
3. Otherwise request a new token from the backend, if admission is allowed.
4. Store the token and its expiry timestamp in browser localStorage.
5. Associate the token with the corresponding session on the backend.

Use cryptographically secure random token generation.

Do not use sequential or predictable identifiers.

Store only a secure hash of the token on the server where practical.

Do not expose tokens in URLs, logs, exports, or public interfaces.

## 8.2 Token Lifetime

Each participation token must have a fixed lifetime of:

**6 hours from its initial issuance.**

Reopening the browser or rescanning the QR code must not extend the expiration time.

A token must remain usable after:

- Page refresh
- Browser closing and reopening
- Temporary connection loss
- Reopening the participation URL
- Rescanning the same QR code

This applies while the token is valid and the session is active.

## 8.3 Token Expiration

A token expires at the earlier of:

- Six hours after issuance
- Session completion or cancellation

Expired or revoked tokens must be rejected by the backend.

The frontend must remove expired tokens from localStorage when the application next executes.

If the browser remains open, it should also clean up expired tokens when practical.

Do not claim that a web application can delete localStorage from a closed browser at the exact expiration instant.

## 8.4 Server Cleanup

On session completion:

- Immediately revoke all session participation tokens.
- Remove token credentials and token-to-vote associations.
- Preserve anonymous voting data.
- Preserve the final results and rankings.

Expired token records must also be cleaned up automatically by a reliable maintenance process.

Do not rely solely on application startup for cleanup.

Ensure cleanup is transactional and does not corrupt results.

## 8.5 Expired Tokens During an Active Session

If a token expires while a session is still active, the student may request a new token if participant admission is open.

Explain this behavior in the UI.

A new token may permit a new vote for a presentation that remains open.

This limitation is accepted because the application intentionally implements lightweight duplicate-vote prevention rather than strict participant identity verification.

Do not add device fingerprinting, IP-based vote restrictions, or mandatory student authentication.

---

# 9. ONE VOTE PER TOKEN PER PRESENTATION

The backend must enforce:

**At most one stored vote per participation token per presentation.**

Use a database-level uniqueness constraint or equivalent transactional enforcement.

A vote consists of one score for every configured criterion.

While voting remains open:

- A student may submit a vote.
- A student may view their own submitted scores.
- A student may edit their existing vote.
- Editing must update the existing vote, not create a duplicate.

After voting closes:

- New votes must be rejected.
- Vote modifications must be rejected.
- The student may see confirmation that voting has closed.

The server is the authoritative source of voting state.

Frontend-only restrictions are insufficient.

Implement appropriate rate limiting for abusive submission bursts without using IP addresses as a duplicate-voting identity.

Do not introduce CAPTCHA unless explicitly requested.

---

# 10. PARTICIPANT ADMISSION CONTROL

Provide an optional setting:

**Lock New Participants**

Default value:

**OFF**

When OFF:

- New students may join at any time during the active session.
- New participation tokens may be issued.

When ON:

- No new participation tokens may be issued.
- Existing valid tokens remain usable.
- Existing participants may reconnect and continue voting.

The lecturer may enable or disable this setting during an active session.

Do not automatically enable participant locking.

---

# 11. PRESENTATION ORDER AND SELECTION

The lecturer must be able to select any pending presentation from the group.

Presentation order must not be fixed.

Example:

The lecturer may conduct presentation 4, followed by presentation 9, followed by presentation 2.

Provide a clear presenter-selection interface showing:

- Presenter name
- Presentation title
- Current status
- Number of votes, when relevant

When a presenter is selected, the lecturer can open voting for that specific presentation.

The student interface must prominently display:

- Presenter full name
- Presentation title, if available
- Course and group
- Evaluation criteria
- Rating controls

Only one presentation voting window may be open at a time within a session.

Different lecturers may operate different sessions concurrently.

---

# 12. VOTING LIFECYCLE

The lecturer must explicitly control voting.

Provide:

- Select presentation
- Open voting
- Close voting
- Optional countdown timer
- Extend voting time
- Pause and resume a countdown, if implemented
- View live submission count
- Move to another pending presentation

The initial suggested voting duration is 60 seconds.

The duration must be configurable.

Manual closing must always be available.

An optional timer may automatically close voting.

The backend must enforce all time limits.

Handle simultaneous submissions and voting closure correctly.

If a vote reaches the backend after the voting window has closed, reject it.

Avoid race conditions that could permit duplicate or late votes.

---

# 13. REAL-TIME UPDATES

Use WebSockets or a reliable equivalent real-time mechanism.

When the lecturer opens a voting window:

- Connected students must automatically see the active presentation.
- They must not refresh the page manually.
- The presenter name and evaluation form must update automatically.

When voting closes:

- Students must automatically see the closed or waiting state.
- Voting controls must become unavailable.

When the lecturer changes presentations:

- Students must see the correct new presenter and criteria.

The lecturer dashboard must receive updated vote counts.

Implement automatic reconnection.

After reconnection, the frontend must fetch authoritative current state from the backend.

Do not rely on WebSocket messages alone for consistency.

---

# 14. PRESENTATION STATES

Implement clear presentation states.

At minimum:

- PENDING
- VOTING_OPEN
- EVALUATED
- NO_VOTES
- SKIPPED

A presentation must be marked EVALUATED when its voting window closes with at least one valid vote.

A presentation that was conducted but received no votes must be marked NO_VOTES.

A presentation that was not conducted must be marked SKIPPED.

The lecturer must be able to skip a pending presentation.

A skipped presentation may be restored to PENDING before session completion.

Do not include SKIPPED or NO_VOTES presentations in numerical rankings.

Do not treat missing scores as zero.

---

# 15. EARLY SESSION COMPLETION

The lecturer must be able to complete a session at any time, even if some scheduled presentations have not taken place.

Example:

15 presentations scheduled.

12 presentations conducted.

3 presenters absent.

The lecturer must be able to complete the session successfully.

On completion:

1. Require an explicit confirmation.
2. Close any open voting window.
3. Mark remaining unpresented presentations appropriately.
4. Finalize valid votes.
5. Calculate final results.
6. Revoke participation tokens.
7. Anonymize stored votes.
8. Prevent further voting or editing.
9. Preserve the session history.

Completion must not require every scheduled presentation to have been evaluated.

Once finalized, the session should be read-only for lecturers.

Do not silently reopen finalized sessions.

---

# 16. SCORING AND RANKING

For each evaluated presentation, calculate the weighted mean score.

Let:

- \(w_i\) be the weight of criterion \(i\), expressed as a fraction.
- \(\bar{x}_i\) be the arithmetic mean of valid student scores for criterion \(i\).

Then:

\[
S = \sum_{i=1}^{n} w_i \bar{x}_i
\]

Weights must sum to 1.

Because each valid vote must contain a score for every criterion, the number of valid votes should be consistent across criteria for a presentation.

Display:

- Presenter name
- Presentation title
- Number of valid votes
- Mean score for each criterion
- Weighted final score
- Rank

Rank presentations by descending final score.

Use unrounded values for ranking calculations.

Round only for display.

Equal scores must receive equal ranks.

Do not invent arbitrary tie-breakers.

If no presentations received valid votes, display an appropriate no-results state rather than declaring a winner.

---

# 17. RESULT VISIBILITY

During an active session:

- Students must not see other students' votes.
- Students must not see average scores.
- Students must not see rankings.
- The public Projector View must not reveal scores.
- Lecturers may see vote counts but should not see interim ratings or rankings through the normal UI.

After completion:

- The lecturer may explicitly reveal results.
- The Projector View may display the final ranking.
- The highest-ranked presentation or tied presentations should be highlighted.

Session completion and public result revelation must be separate actions.

---

# 18. ANONYMOUS ANALYTICAL RESULTS

Preserve anonymous analytical data after session completion.

This requirement is important.

Do not retain participation tokens indefinitely.

On completion, remove the link between participant tokens and submitted ratings.

Preserve enough information to:

- Recalculate criterion averages.
- Verify weighted results.
- Verify vote counts.
- Audit numerical calculations.
- Export anonymous analytical scores.

A suitable design is to store anonymous criterion-score records after removing participant identifiers.

Do not include participant tokens, browser identifiers, or IP addresses in exported datasets.

Ensure the anonymization process is reliable and tested.

Consider the privacy implications of preserving timestamps and other metadata.

Do not preserve unnecessary metadata that could facilitate re-identification.

---

# 19. RESULTS EXPORT

Support:

- CSV
- Excel `.xlsx`

Exports must include:

- Course
- Academic period
- Group
- Session date
- Presenter
- Presentation title
- Presentation status
- Number of valid votes
- Mean score per criterion
- Criterion weights
- Weighted final score
- Final rank

Also provide a separate anonymous detailed-score export when appropriate.

Ensure proper Unicode and Greek-language compatibility.

CSV files should open correctly in commonly used spreadsheet software.

---

# 20. DEMO AND TEST SESSIONS

Provide a dedicated demo-session capability.

A demo session must be clearly labeled as DEMO.

Support two modes.

## 20.1 Simulated Demo

Allow generation of:

- Example presenters
- Example criteria
- Synthetic participants
- Synthetic votes

The administrator or lecturer should be able to test calculations and rankings.

Synthetic votes must be clearly distinguished from real submissions.

## 20.2 Real-Device Demo

Allow a demo session to operate using real smartphones and a QR code.

This must exercise the same voting and real-time infrastructure as a normal session.

Demo data must remain separate from production session data.

Provide options to reset or delete demo sessions.

---

# 21. SESSION DUPLICATION

Provide a feature to duplicate an existing session.

The new session may inherit:

- Course
- Academic period, when appropriate
- Evaluation criteria
- Criterion weights
- Voting duration
- Participant admission settings
- Other non-sensitive configuration

Allow the lecturer to select:

- New session date
- New group
- New presentation list

Do not copy:

- Votes
- Participation tokens
- Results
- Rankings
- Completion state

The duplicated session must begin as a new draft session with its own identifiers and QR code.

---

# 22. SESSION MANAGEMENT

Support session states:

- DRAFT
- ACTIVE
- COMPLETED
- ARCHIVED

DRAFT:

- Editable configuration.
- No voting allowed.

ACTIVE:

- Participant entry allowed according to admission settings.
- Lecturer-controlled voting.
- Criteria locked after the first voting window opens.

COMPLETED:

- Voting permanently closed.
- Tokens revoked.
- Results finalized.
- Read-only session data.

ARCHIVED:

- Historical read-only session.

Provide appropriate state-transition validation.

Prevent invalid transitions.

---

# 23. USER INTERFACE REQUIREMENTS

Create a professional, clean, responsive interface.

The application is intended for university use.

Avoid unnecessary visual effects or excessive complexity.

## 23.1 Administrator Dashboard

Include:

- User management
- Course management
- Group management
- All sessions
- Ownership management
- System settings
- Basic system status

## 23.2 Lecturer Dashboard

Include:

- My Courses
- My Groups
- My Sessions
- Create Session
- Import Presenters
- Evaluation Criteria
- Voting Control
- Results
- Demo Sessions

## 23.3 Student Interface

Optimize for smartphones.

Include:

- Course and group
- Session date
- Waiting state
- Active presenter name
- Presentation title
- Criteria and score selection
- Submit vote
- Confirmation
- Existing vote and edit capability
- Voting closed state
- Expired-token handling
- Connection status

Avoid horizontal scrolling.

Use clear Greek labels and readable typography.

## 23.4 Projector View

Optimize for a classroom projector.

Provide:

- Fullscreen-friendly layout
- Large presenter name
- Clear voting status
- Permanent QR code
- Participation URL
- Vote count
- Final rankings after explicit revelation

---

# 24. SECURITY REQUIREMENTS

Implement reasonable production-grade security.

At minimum:

- Secure password hashing
- Authenticated administrator and lecturer sessions
- Backend role and ownership enforcement
- CSRF protection when cookie-based authentication is used
- Secure cookie settings
- Appropriate CORS configuration
- Input validation
- Output escaping
- Protection against SQL injection
- File upload validation
- Upload size limits
- Spreadsheet formula-injection protection
- Safe error messages
- Secrets stored in environment variables
- No plaintext credentials in logs
- No participation tokens in logs
- No trust in client-submitted voting status
- Transactional vote updates
- Server-side session-state enforcement

Do not use IP addresses for duplicate-vote prevention.

Avoid unnecessary collection of student personal data.

If standard infrastructure access logs contain IP addresses, document their handling separately from the voting system and minimize retention where practical.

---

# 25. DATABASE DESIGN

Design normalized database tables for the required entities.

Likely entities include:

- Users
- Courses
- AcademicPeriods
- Groups
- Students
- PresentationSessions
- Presentations
- EvaluationCriteria
- ParticipationTokens
- Votes
- VoteScores
- AnonymousVoteScores
- SessionResults
- PresentationResults

You may refine the schema when justified.

Provide:

- Primary keys
- Foreign keys
- Unique constraints
- Appropriate indexes
- Ownership relationships
- Creation and modification timestamps
- Migrations

Use transactions to guarantee consistency.

SQLite must be configured appropriately for concurrent access, including WAL mode and reasonable busy timeouts where applicable.

Do not assume SQLite will support unlimited concurrent writes.

Document practical concurrency limits and the upgrade path to PostgreSQL.

---

# 26. DEPLOYMENT

Provide a working Docker Compose deployment.

Include:

- Backend service
- Frontend serving strategy
- Persistent database volume
- Environment configuration
- Health checks
- Restart policies
- Appropriate service networking

The deployment must support:

## 26.1 Local Network

Example:

`http://192.168.x.x:PORT`

Students on the same reachable network must be able to access the application.

Document that campus Wi-Fi client isolation or firewall rules may prevent local access.

## 26.2 Private Server

Support deployment behind Traefik using HTTPS.

The deployment should be compatible with an existing external Docker network, such as `frontend`, but must not require that network for local use.

Make the public base URL configurable.

WebSocket connections must work correctly through the reverse proxy.

Do not hardcode a domain name.

Do not modify existing Traefik services or unrelated containers.

Provide example configuration for Traefik labels.

Do not automatically expose administrator endpoints through insecure configurations.

---

# 27. CONFIGURATION

Provide a complete `.env.example`.

Include clearly documented settings for:

- Public base URL
- Database location
- Administrator bootstrap
- Authentication secrets
- Allowed origins
- Deployment environment
- Logging level
- Default voting duration
- Default token lifetime: 6 hours
- Timezone, default Europe/Athens
- Relevant cleanup and security settings

Never commit actual secrets.

Validate configuration on startup and fail clearly when required production settings are missing.

---

# 28. AUTOMATED TESTING

Create and execute a comprehensive test suite.

At minimum, test:

## Authentication and Authorization

1. Administrator login.
2. Lecturer login.
3. Invalid password rejection.
4. Lecturer cannot create administrator accounts.
5. Lecturer cannot access another lecturer's sessions.
6. Administrator can access all sessions.
7. Deactivated users cannot access protected functions.

## Participation Tokens

8. Token issuance.
9. Token reuse after reconnect.
10. Token expiration after six hours.
11. Reopening the browser does not extend token lifetime.
12. Expired token rejection.
13. Session completion revokes tokens.
14. Token cleanup preserves anonymous results.
15. Participant locking defaults to OFF.
16. Participant locking prevents new tokens.
17. Existing tokens remain valid while admission is locked.

## Voting

18. Voting is impossible before opening.
19. Voting is possible while open.
20. Voting is impossible after closing.
21. One stored vote per token per presentation.
22. Existing votes can be edited while open.
23. Edits do not increase vote count.
24. Concurrent duplicate submissions do not create duplicate votes.
25. All configured criteria must be scored.
26. Invalid score values are rejected.
27. A participant can vote on multiple different presentations.
28. Different sessions remain isolated.

## Presentation Management

29. Lecturer may select presentations out of order.
30. Only one voting window is open per session.
31. Skipped presentations are excluded from ranking.
32. Skipped presentations can be restored before completion.
33. Sessions may complete with fewer presentations.
34. Sessions with no valid votes are handled correctly.

## Scoring

35. Weighted averages are calculated correctly.
36. Weights must total 100%.
37. Rankings use unrounded values.
38. Ties are handled correctly.
39. Missing presentations are not assigned zero scores.
40. Anonymous detailed results reproduce final aggregates.

## Imports and Exports

41. CSV import with Greek text.
42. XLSX import with Greek text.
43. Duplicate-name warnings.
44. Invalid file rejection.
45. Correct CSV export.
46. Correct XLSX export.
47. No tokens in exports.

## Demo and Duplication

48. Demo sessions remain isolated.
49. Demo data can be reset.
50. Session duplication preserves configuration.
51. Session duplication does not copy votes or results.

## End-to-End

52. Lecturer creates a session.
53. Student joins using QR URL.
54. Lecturer opens voting.
55. Student submits scores.
56. Lecturer closes voting.
57. Lecturer selects another presenter.
58. Student votes again without rescanning.
59. Lecturer completes the session early.
60. Lecturer reveals results.
61. Lecturer exports results.

Use deterministic test data where possible.

Run tests rather than merely writing them.

Report the results accurately.

---

# 29. DOCUMENTATION

Create complete project documentation.

At minimum:

`README.md`

- Project overview
- Features
- Architecture
- Requirements
- Quick start
- Local deployment
- Docker deployment
- Traefik deployment
- Environment configuration
- Common troubleshooting

`ARCHITECTURE.md`

- Components
- Database design
- Authentication and authorization
- Token lifecycle
- Voting lifecycle
- Real-time synchronization
- Anonymization strategy

`ADMIN_GUIDE.md`

- Initial administrator setup
- User creation
- User management
- Ownership management
- Backup and restore

`LECTURER_GUIDE.md`

- Course creation
- Group creation
- Importing presenters
- Configuring criteria
- Creating sessions
- Displaying QR code
- Opening and closing voting
- Skipping presentations
- Completing sessions
- Exporting results

`DEPLOYMENT.md`

- Local installation
- Docker Compose
- Traefik and HTTPS
- Network configuration
- WebSocket troubleshooting
- Persistent volumes
- Backup procedures
- Updating the application

`TESTING.md`

- Test commands
- Test categories
- Test fixtures
- End-to-end testing
- Known limitations

`CHANGELOG.md`

- Initial version and subsequent changes

Provide a complete `.env.example`.

---

# 30. DEVELOPMENT WORKFLOW

Follow this workflow.

## Phase 1 — Repository Inspection

Inspect the current working directory.

If an existing project is present, inspect it before making changes.

Do not overwrite unrelated files.

Identify the existing architecture and reusable components.

## Phase 2 — Architecture and Implementation Plan

Produce a concise architecture plan.

Identify the database schema, API routes, authentication model, voting state machine, and frontend components.

Record important design decisions.

Do not stop here.

## Phase 3 — Backend Implementation

Implement:

- Database models
- Migrations
- Authentication
- Authorization
- Course and group management
- Session management
- Import functionality
- Token lifecycle
- Voting operations
- Results and anonymization
- Export functionality
- WebSocket synchronization

## Phase 4 — Frontend Implementation

Implement:

- Login
- Administrator dashboard
- Lecturer dashboard
- Course/group/session forms
- Import preview
- Criteria editor
- Voting control panel
- Student mobile interface
- Projector View
- Results dashboard
- Demo mode

## Phase 5 — Deployment

Create Docker configuration and environment templates.

Verify persistent storage and correct application startup.

## Phase 6 — Testing

Run automated tests.

Fix failures.

Perform end-to-end checks.

Do not claim tests passed unless they actually ran successfully.

## Phase 7 — Documentation

Complete the documentation and provide clear installation instructions.

## Phase 8 — Final Review

Perform a final audit of:

- Functional completeness
- Security
- Data integrity
- Authorization
- Token expiration
- Anonymization
- Concurrent voting
- Deployment readiness
- Documentation

---

# 31. ACCEPTANCE CRITERIA

The application is complete only when the following workflow works:

1. An administrator initializes the system.
2. The administrator creates a lecturer account.
3. The lecturer logs in.
4. The lecturer creates a course.
5. The lecturer creates an academic period.
6. The lecturer creates Group C.
7. The lecturer imports 15 students from Excel.
8. The lecturer creates a session dated 21 October 2026.
9. The lecturer configures three weighted evaluation criteria.
10. The lecturer activates the session.
11. The Projector View displays the permanent QR code.
12. Students scan the QR code.
13. Students receive six-hour participation tokens.
14. The lecturer selects a presenter out of order.
15. The lecturer opens voting.
16. Student phones automatically display the selected presenter.
17. Students submit their scores.
18. Repeated submission updates the existing vote.
19. The lecturer closes voting.
20. Students return to the waiting screen.
21. A student closes and reopens their browser.
22. The same valid token is reused.
23. The lecturer opens voting for another presenter.
24. Students vote again without requiring a new QR code.
25. Three presenters are absent.
26. The lecturer skips those presentations.
27. The lecturer completes the session after 12 presentations.
28. Participation tokens are revoked.
29. Anonymous scores remain available.
30. The lecturer reveals the final ranking.
31. The results correctly exclude skipped presentations.
32. The lecturer exports Excel and CSV files.
33. The lecturer duplicates the session without copying votes.
34. A different lecturer cannot access this session.
35. The administrator can access and manage all sessions.

This complete workflow must be supported by the actual implementation.

---

# 32. IMPLEMENTATION QUALITY REQUIREMENTS

Use clear, maintainable code.

Prefer:

- Strong typing
- Small, testable functions
- Explicit state transitions
- Centralized authorization checks
- Transaction-safe voting
- Reusable frontend components
- Database migrations
- Meaningful error messages
- Structured logging
- Configuration validation

Avoid:

- Hardcoded credentials
- Hardcoded course names
- Hardcoded student counts
- Hardcoded presenter order
- Client-side-only authorization
- Client-side-only vote enforcement
- Insecure token generation
- Silent error suppression
- Placeholder functionality presented as complete
- Mock results in production screens
- Unnecessary paid dependencies

When trade-offs arise, prioritize correctness, data integrity, usability, and maintainability over visual complexity.

---

# 33. FINAL DELIVERABLES

At the end, provide:

1. Complete working source code.
2. Backend and frontend applications.
3. Database models and migrations.
4. Docker Compose configuration.
5. Traefik-compatible deployment example.
6. `.env.example`.
7. Administrator bootstrap mechanism.
8. CSV/XLSX import templates.
9. Automated tests.
10. Documentation files.
11. Demo data or demo initialization commands.
12. A concise summary of implemented functionality.
13. Exact commands to run the application locally.
14. Exact commands to deploy it with Docker.
15. Test results, including any failures.
16. Known limitations.
17. Any remaining tasks requiring user input.

If the repository is under Git version control, keep changes organized and avoid modifying unrelated projects.

Do not commit secrets.

Do not deploy to a public server or modify existing infrastructure without explicit authorization.

---

# 34. IMPORTANT FINAL INSTRUCTIONS

This is an implementation task, not merely a design exercise.

Proceed autonomously through architecture, coding, testing, documentation, and local validation.

Do not repeatedly ask for confirmation about routine technical decisions.

Make reasonable engineering decisions consistent with these requirements.

Ask for clarification only when an unresolved decision would materially affect functionality, security, or data integrity.

If a requirement cannot be fully implemented, clearly identify the limitation and explain what remains incomplete.

Do not falsely report successful tests, completed functionality, or deployment readiness.

**The goal is a complete, tested, self-hosted Student Presentation Voting application that can be used in a real university classroom.**
