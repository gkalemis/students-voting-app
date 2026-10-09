# STUDENT PRESENTATION VOTING
## Supplementary Implementation Requirements — Version 2.2

**This document supplements the previously approved Student Presentation Voting v2.0 specification.**

Implement all requirements from v2.0, together with the amendments below.

Where this document changes or clarifies a v2.0 requirement, **v2.2 takes precedence**.

Do not remove, weaken, or replace unrelated v2.0 functionality.

Do not implement this supplement as a separate application. Integrate it into the same backend, frontend, database, security model, and deployment.

---

# 1. MULTIPLE CONCURRENT VOTING SESSIONS

The application must support multiple independent voting sessions running simultaneously.

Each session belongs to one lecturer and has its own:

- Presentations
- Participation tokens
- QR code
- Connected participants
- Voting state
- WebSocket communication
- Results and rankings

Only one presentation may have an open voting window within a particular session.

However, different sessions may have open voting windows simultaneously.

For example, six lecturers may conduct six independent voting sessions at the same time.

The expected real-world deployment is approximately six lecturers and up to 90 students in total.

These numbers describe expected usage, **not hard limits**.

Do not implement artificial numerical restrictions on:

- Number of lecturers
- Number of simultaneous sessions
- Number of students
- Number of presentations

Actual capacity may depend on hardware, network conditions, and database performance.

Do not introduce mandatory large-scale load tests targeting 20 sessions or 1,000 users.

Retain normal automated tests for concurrent submissions, session isolation, data integrity, and WebSocket behavior.

---

# 2. LIVE EDITING OF PRESENTER INFORMATION

A lecturer must be able to edit the presenter information at any time before session finalization, including while voting is open.

Editable fields:

1. Presenter full name
2. Presentation title

The presentation title must remain optional.

The lecturer must be able to add a previously missing title during an active voting window.

Changes must not require:

- Closing voting
- Restarting the presentation
- Generating a new QR code
- Reissuing participation tokens
- Resetting existing votes

## 2.1 Stable Presentation Identity

Every presentation must have a stable internal `presentation_id`.

Votes must reference this identifier.

Never use the presenter's name or presentation title as the voting relationship key.

Changing either field must not modify:

- Presentation ID
- Existing votes
- Vote counts
- Scores
- Weighted results
- Participation tokens

## 2.2 Real-Time Synchronization

After a successful update, broadcast the changed presenter information to the appropriate session clients.

Update:

- Lecturer dashboard
- Projector View
- Connected student smartphones

Use the existing WebSocket infrastructure.

Updates must appear without manual page refresh.

The frontend must preserve partially completed, unsubmitted rating selections when presenter information changes.

Do not remount or reset the voting form unnecessarily.

If a WebSocket connection is temporarily unavailable, the client must retrieve the latest presenter information after reconnection.

## 2.3 Authorization

Only the owning lecturer and an authorized administrator may edit presenter information.

Students must not be able to edit presenter information.

## 2.4 Change History

Maintain a lightweight audit history for changes to presenter names and presentation titles.

Record:

- Presentation ID
- Changed field
- Previous value
- New value
- User who made the change
- Timestamp

This history must be visible only to authorized administrators and the session owner.

Do not expose it through the public voting interface.

---

# 3. INSTITUTIONAL BRANDING

Add configurable institutional branding to the application.

The application must support:

- University name
- School name
- Optional department name
- University logo
- Optional background
- Background opacity
- Branding preview

The branding system must be configurable through the application interface.

Do not hardcode any university, school, or department name.

## 3.1 Global Branding

Administrators must be able to configure the default institutional branding.

Provide an administration page such as:

**Settings → Institutional Branding**

The administrator must be able to:

- Enter university name
- Enter school name
- Enter optional department name
- Upload or replace the logo
- Remove the logo
- Configure the background
- Preview the result
- Save changes
- Restore default appearance

## 3.2 Course-Level Branding

Lecturers must be able to customize branding for their own courses.

Allow optional overrides for:

- University name
- School name
- Department name
- Logo
- Background settings

When a course does not define an override, use the global branding configuration.

Course-level changes must not affect other lecturers' courses.

Administrators may manage all branding configurations.

## 3.3 Logo Upload

Support commonly used image formats:

- PNG
- JPEG
- WebP
- SVG, only with robust sanitization and secure handling

Validate uploaded files.

Apply reasonable upload-size limits.

Do not trust filename extensions alone.

Prevent executable or malicious content from being uploaded or served.

If secure SVG processing cannot be guaranteed, reject unsafe SVG files and document the restriction.

Store uploaded branding assets in persistent storage compatible with Docker volumes.

Do not embed uploaded images directly into the database unless there is a clear technical justification.

## 3.4 Background Options

Support:

1. Solid color
2. Subtle gradient
3. Uploaded background image
4. No background

Allow the user to adjust image opacity.

The background must be visually subtle.

The default appearance should be a clean, light, neutral academic interface.

A background image should behave like a restrained watermark rather than a dominant illustration.

Ensure:

- Readable text
- Sufficient contrast
- Clear rating controls
- Accessible buttons
- Reliable QR code scanning

The QR code must always appear on a solid, high-contrast surface.

Do not apply opacity directly to the QR code.

## 3.5 Branding Locations

Apply appropriate institutional branding to:

- Login page
- Lecturer dashboard
- Student voting interface
- Projector View
- Results view
- Excel results export

On smartphones, branding must be compact and must not interfere with voting.

On the Projector View, the logo and university/school name should be clearly visible without reducing the prominence of the presenter and QR code.

For Excel exports, include the institutional identity in a header or dedicated summary worksheet.

Keep machine-readable CSV exports clean and compatible with automated processing.

## 3.6 Preview and Persistence

Provide a live preview of branding changes before saving.

Branding settings must persist after application restart.

Uploaded assets must persist after Docker container recreation.

Handle missing or deleted assets gracefully.

---

# 4. SECURITY AND DATA INTEGRITY

All new features must follow the existing v2.0 security requirements.

In particular:

- Enforce ownership checks on branding and presenter-editing endpoints.
- Validate and sanitize uploaded files.
- Prevent path traversal.
- Protect stored files from unauthorized modification.
- Preserve existing votes during presenter edits.
- Do not expose administrative data through WebSocket events.
- Do not broadcast changes across unrelated sessions.
- Keep institutional branding separate from participant identity and voting data.

Presenter edits must be atomic database operations.

Concurrent editing must not corrupt presentation records.

---

# 5. ADDITIONAL AUTOMATED TESTS

Add tests covering:

1. Two lecturers running independent active sessions simultaneously.
2. Session A receiving no updates intended for Session B.
3. Editing presenter name while voting is open.
4. Adding presentation title while voting is open.
5. Existing votes remaining unchanged after presenter edits.
6. Vote counts remaining unchanged after presenter edits.
7. Partially completed student rating forms retaining their selections.
8. Projector View receiving updated presenter information.
9. Student interface receiving updated presenter information.
10. Unauthorized users being unable to edit presenter information.
11. Presenter change history recording correct values.
12. Administrator configuring global branding.
13. Lecturer configuring course-level branding.
14. Course branding correctly overriding global branding.
15. Other lecturers' courses remaining unaffected.
16. Invalid image uploads being rejected.
17. Branding assets persisting across application restarts.
18. Background settings not compromising QR code visibility.
19. Branding appearing in Excel exports.
20. Existing v2.0 functionality continuing to work.

Run the relevant tests and report actual results.

---

# 6. DOCUMENTATION UPDATES

Update the existing documentation to cover:

- Concurrent sessions
- Live presenter editing
- Presenter change history
- Global institutional branding
- Course-level branding
- Logo uploads
- Background customization
- Branding asset storage and backup
- Updated testing procedures

Update `CHANGELOG.md` to document the v2.2 changes.

---

# 7. IMPLEMENTATION INSTRUCTIONS

Read the complete v2.0 specification before implementing these changes.

Integrate the additions into the existing project.

Do not create a second application.

Do not remove previously approved functionality.

If implementing from an empty repository, implement the combined v2.0 and v2.2 specifications as one coherent application.

If the v2.0 implementation already exists, inspect the code and integrate the changes through appropriate migrations and incremental modifications.

Preserve existing user, course, session, and voting data.

Do not reset or delete production data to implement these features.

Do not deploy publicly or modify unrelated infrastructure without explicit authorization.

**The final application must satisfy the complete v2.0 specification together with every amendment in this v2.2 document.**
