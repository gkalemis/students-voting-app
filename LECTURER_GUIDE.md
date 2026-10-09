# Lecturer guide

On first connection, replace the temporary password under **Λογαριασμός**. Course and voting APIs remain unavailable until this is complete. Use a unique password and do not share accounts.

Create a course, academic period and group. Presenters can be entered manually or imported after preview from UTF-8 CSV/XLSX using columns `Student Name` and optional `Presentation Title`; duplicate names are warnings because they may be legitimate. Templates are available from `/api/import-template.csv` and `.xlsx`.

Create a session with criteria totaling exactly 100%. Activate it and open Projector View in a second window. Students keep the same session-specific token for six hours. Select presenters in any order. Open/close each vote explicitly, edit its name/title without closing, skip absences, or restore them. Completing is permanent, marks pending presentations skipped, and invalidates participants. Reveal results separately. Exports appear after completion; duplicate creates a new draft without votes or credentials.

Course branding overrides only supplied global fields. Keep backgrounds subtle and confirm the projector QR scans at classroom distance.

If access is lost, request a temporary reset from an administrator or authorized server operator. It revokes existing sessions and must be replaced immediately. Email recovery is not yet available.

