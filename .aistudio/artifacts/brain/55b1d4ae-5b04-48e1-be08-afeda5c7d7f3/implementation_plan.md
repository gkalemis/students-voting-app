# Hierarchy Order Alignment, Retractable Student Manager, and Live Course Structure Sync

## Overview & Core Concept
Align the systemic order of entities across the platform (CSV imports, templates, forms, dashboard sections, and projector headers) to the strict canonical sequence: **Period → Course → Group → Students → Presentation Title**. In the Lecturer Dashboard, wrap the student roster inside a retractable, collapsible panel with scroll containment so that inserting dozens of students never elongates the viewport or pushes the Course Structure out of view. Connect student additions and deletions to an instant update hook that refreshes the Course Structure tree in real time without page reloads.

---

## User Review & Critical Decisions

> [!IMPORTANT]
> **No code modifications will be executed until this plan is reviewed and approved.**
> Please review the architectural choices and UI layout below.

- **Canonical Order Enforced Everywhere**:
  - **CSV Hierarchy Import**: `Period, Course, Group, Student, Topic` (previously Course was first).
  - **Dashboard Sections**: Periods list first, then Courses list, then Groups list, followed by Student Management and Course Structure.
  - **Context Tags (Projector & Headers)**: `Period · Course · Group · Student · Topic` consistently.
- **Retractable Student Manager Component**:
  - A collapsible card widget with an intuitive toggle header (`👥 Manage Students · [N students]`, collapsible/expandable with smooth transition).
  - Internal roster list capped at a maximum viewport height (`max-height: 360px` with vertical scroll), keeping 30+ students cleanly contained even when expanded.
  - Retractable toggle state preserved locally or easily accessible with a single click.
- **Instant Reactive Course Structure Updates**:
  - Introduce a synchronization trigger (`studentsVersion` state counter / callback) between `StudentManager`, `CsvImportModal`, and `HierarchyView` on the Dashboard.
  - Inserting, importing, or deleting a student will immediately trigger `HierarchyView` to fetch the updated student tree, eliminating the need to refresh or reselect groups.

---

## 1. System Architecture & Component Flow

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Lecturer Dashboard Page                         │
├────────────────────────────────────────────────────────────────────────┤
│ 1. Structured Action Toolbar (Workflow: Period → Course → Group)       │
│ 2. Canonical Resource Overview Pills:                                  │
│    ├── [Academic Periods]                                              │
│    ├── [Courses]                                                       │
│    └── [Student Groups]                                                │
├────────────────────────────────────────────────────────────────────────┤
│ 3. Retractable Student Manager (Collapsible Tool)                      │
│    ├── Header: "Manage Students" + Group Select + Count Badge + Toggle │
│    ├── [Retracted View]: Compact 1-line bar, 0 screen clutter          │
│    └── [Expanded View]:                                                │
│        ├── Add Student Inline Form (Full Name + Subject)               │
│        └── Scroll-contained Roster (max-h: 360px, delete triggers)     │
│             │                                                          │
│             └── onStudentsChanged() ──┐                                │
├───────────────────────────────────────┼────────────────────────────────┤
│ 4. Course Structure Tree (HierarchyView)                              │
│    └── Listens to onStudentsChanged() ◄┘ [Instant live re-fetch]       │
│        Period → Course → Group → Students (Name · Presentation Title)  │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Key Product & UX Decisions

### Decision 1: Canonical Entity Ordering (Period → Course → Group → Students → Presentation Title)
- **Current State**:
  - CSV templates and chips had `Course, Period, Group, Student, Topic`.
  - Dashboard rendered `Courses` pills before `Periods` pills.
  - Projector rendered `{course} · {period} · {group}`.
- **Planned State**:
  - CSV templates, chips, parsing logic, and fallback header indices re-indexed to: `Period, Course, Group, Student, Topic`.
  - Dashboard renders: `Periods` → `Courses` → `Groups`.
  - Projector & Presentation cards render: `Period · Course · Group`.
- **Why**: An academic period (e.g. Winter 2024-2025) is the root temporal container that contains courses; courses contain student groups; groups contain students; students present on a presentation topic. Aligning this hierarchy across imports, views, and navigation ensures cognitive consistency.

### Decision 2: Retractable Tool for Student Management
- **Current State**: A flat `<div className="list">` of full-width cards. With 30 students, it spans over 2,000 pixels vertically, requiring 4-5 screen scrolls to view the Course Structure below it.
- **Planned State**:
  - Implement a clean accordion/retractable panel with a clear toggle switch (`▲ Collapse / ▼ Expand`) and active count badge (e.g. `18 students in Group 1`).
  - Provide a compact roster view with internal overflow scroll (`max-height: 360px; overflow-y: auto;`) so even when expanded with 50 students, the dashboard layout remains compact and predictable.
  - Keep the "Add Student" input form and "Import CSV" button readily accessible.

### Decision 3: Reactive State Synchronization for Course Structure
- **Current State**: `HierarchyView` only re-fetched students when the string of group IDs changed (`[groups.map(x => x.id).join(',')]`). Adding or deleting a student in `StudentManager` made changes in the database, but `HierarchyView` never re-queried, leaving the Course Structure stale.
- **Planned State**:
  - Pass a shared update notification callback `onStudentsChanged` from `Dashboard` to `StudentManager` and `CsvImportModal`.
  - Pass a reactive trigger (e.g., `lastUpdatedTimestamp` or `version`) to `HierarchyView`, prompting an immediate query to `/groups/${g.id}/students` and live re-render of the hierarchy tree.

---

## 3. Detailed Implementation Steps

### Step 1: Update CSV Parser & CSV Import Modal Order
1. In `server/csvParser.ts`:
   - Change default headerless mapping to: `0: period`, `1: course`, `2: group`, `3: full_name`, `4: presentation_title`.
   - Update `extractRows` fallback column logic.
2. In `src/components/CsvImportModal.tsx`:
   - Reorder hierarchy sample string: `\ufeffΠερίοδος,Μάθημα,Ομάδα,Φοιτητής,Θέμα\n...`.
   - Reorder column tags chips: Period tag first, then Course, Group, Student, Topic.
   - Update help text and preview columns to follow this exact order.

### Step 2: Reorder Dashboard Resource Sections & Projector Context
1. In `src/pages/Dashboard.tsx`:
   - Place `<ResourceSection title={t('periods')} items={periods.map(x => x.name)} />` first.
   - Place `<ResourceSection title={t('courses')} items={courses.map(x => x.name)} />` second.
   - Place `<ResourceSection title={t('groups')} items={groups.map(x => x.title)} />` third.
2. In `src/pages/Projector.tsx` & `src/components/PresentationHeaderCard.tsx`:
   - Reorder context badges to display: `{period} · {course} · {group}`.

### Step 3: Implement Retractable Student Manager
1. In `src/components/StudentManager.tsx`:
   - Add retractable state `isCollapsed` (with toggle button and active indicator).
   - Add student counter tag in the header (e.g., `(24 φοιτητές)`).
   - Wrap the student roster in a scroll-contained viewport with compact rows:
     ```css
     .student-roster-scroll {
       max-height: 360px;
       overflow-y: auto;
       border: 1px solid var(--border);
       border-radius: 8px;
       padding: 0.5rem;
     }
     ```
   - Retain full functionality: inline student addition, deletion with confirmation modal, and CSV import trigger.

### Step 4: Real-time Sync with Course Structure
1. In `src/pages/Dashboard.tsx`:
   - Add state: `const [studentVersion, setStudentVersion] = useState(0);`.
   - Provide `onStudentsChanged={() => setStudentVersion(v => v + 1)}` to `StudentManager` and `CsvImportModal`.
   - Pass `refreshKey={studentVersion}` to `<HierarchyView />`.
2. In `src/components/HierarchyView.tsx`:
   - Include `refreshKey` in the `useEffect` dependencies so adding or deleting a student immediately refreshes the hierarchy tree.

---

## 4. Verification & Testing Strategy
- **CSV Import Flow**: Test downloading the template and uploading sample rows with `Period, Course, Group, Student, Topic` to ensure exact column mapping.
- **Roster Retraction & Density**: Test with 30+ students; verify that expanding/collapsing works smoothly, scrolling is contained within 360px, and Course Structure remains visible without excessive page scrolling.
- **Live Sync Verification**: Add a student; verify the new student immediately appears in the Course Structure tree. Delete a student; verify the student immediately vanishes from the Course Structure tree without page refresh.
