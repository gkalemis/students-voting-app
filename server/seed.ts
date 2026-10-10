import bcrypt from 'bcryptjs';
import { db } from './db';
import { User, AcademicPeriod, Course, StudentGroup, PresentationSession } from './types';

export function seedInitialData() {
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin';
  const adminUsername = process.env.ADMIN_USERNAME || 'admin';

  const existingAdmin = db.users.find(u => u.username.toLowerCase() === adminUsername.toLowerCase() || u.role === 'ADMIN');
  if (existingAdmin) {
    if (!bcrypt.compareSync(adminPassword, existingAdmin.password_hash)) {
      existingAdmin.password_hash = bcrypt.hashSync(adminPassword, 10);
      existingAdmin.must_change_password = false;
      existingAdmin.active = true;
    }
  }

  if (db.users.length > 0) return;

  // Password for admin is 'admin' as requested by the user for testing
  const adminHash = bcrypt.hashSync(adminPassword, 10);
  const lecturerHash = bcrypt.hashSync('lecturer123', 10);

  const admin: User = {
    id: db.nextUserId++,
    username: adminUsername,
    full_name: 'Administrator',
    password_hash: adminHash,
    role: 'ADMIN',
    active: true,
    must_change_password: false,
    auth_version: 0,
    theme_color: '#0e2a47'
  };
  db.users.push(admin);

  const lecturer: User = {
    id: db.nextUserId++,
    username: 'lecturer',
    full_name: 'Καθηγητής / Professor',
    password_hash: lecturerHash,
    role: 'LECTURER',
    active: true,
    must_change_password: false,
    auth_version: 0,
    theme_color: '#0e2a47'
  };
  db.users.push(lecturer);

  const period: AcademicPeriod = {
    id: db.nextPeriodId++,
    name: 'Ακαδημαϊκό Έτος 2025-2026',
    owner_id: lecturer.id
  };
  db.periods.push(period);

  const course: Course = {
    id: db.nextCourseId++,
    name: 'Συγκοινωνιακά Έργα & Υποδομές',
    description: 'Αξιολόγηση παρουσιάσεων εξαμηνιαίων θεμάτων και εργασιών',
    owner_id: lecturer.id,
    period_id: period.id
  };
  db.courses.push(course);

  const group: StudentGroup = {
    id: db.nextGroupId++,
    title: 'Ομάδα Α (Παρουσιάσεις Θεμάτων)',
    course_id: course.id,
    period_id: period.id,
    owner_id: lecturer.id,
    presentation_date: new Date().toISOString().slice(0, 10)
  };
  db.groups.push(group);

  const studentList = [
    { name: 'Γιώργος Παπαδόπουλος', title: 'Σχεδιασμός Κυκλοφοριακών Κόμβων και Βιώσιμη Κινητικότητα' },
    { name: 'Ελένη Δημητρίου', title: 'Ανάλυση Συγκοινωνιακών Δεδομένων με Ευφυή Συστήματα' },
    { name: 'Νικόλαος Καραγκούνης', title: 'Περιβαλλοντικές Επιπτώσεις Υποδομών Μεταφορών' },
    { name: 'Μαρία Βασιλείου', title: 'Ασφάλεια Οδικών Δικτύων και Διαχείριση Κυκλοφορίας' }
  ];

  for (const s of studentList) {
    db.students.push({
      id: db.nextStudentId++,
      group_id: group.id,
      full_name: s.name,
      presentation_title: s.title
    });
  }

  const session: PresentationSession = {
    id: db.nextSessionId++,
    public_id: 'demo-session',
    course_id: course.id,
    period_id: period.id,
    group_id: group.id,
    owner_id: lecturer.id,
    session_date: group.presentation_date || new Date().toISOString().slice(0, 10),
    title: 'Συνεδρία Παρουσιάσεων Εξαμήνου',
    status: 'ACTIVE',
    lock_new_participants: false,
    criteria_locked: false,
    voting_duration: 90,
    is_demo: false,
    results_revealed: false
  };
  db.sessions.push(session);

  const criteriaList = [
    { name: 'Επιστημονική τεκμηρίωση', weight: 40 },
    { name: 'Σαφήνεια και οργάνωση', weight: 30 },
    { name: 'Κριτική σκέψη & Απαντήσεις', weight: 30 }
  ];

  for (let i = 0; i < criteriaList.length; i++) {
    db.criteria.push({
      id: db.nextCriterionId++,
      session_id: session.id,
      name: criteriaList[i].name,
      weight: criteriaList[i].weight,
      position: i
    });
  }

  const groupStudents = db.students.filter(s => s.group_id === group.id);
  for (let i = 0; i < groupStudents.length; i++) {
    const st = groupStudents[i];
    db.presentations.push({
      id: db.nextPresentationId++,
      session_id: session.id,
      student_id: st.id,
      presenter_name: st.full_name,
      title: st.presentation_title,
      position: i,
      status: i === 0 ? 'VOTING_OPEN' : 'PENDING',
      voting_opened_at: i === 0 ? new Date().toISOString() : null,
      voting_closes_at: i === 0 ? new Date(Date.now() + 180000).toISOString() : null,
      criteria: db.criteria.filter(c => c.session_id === session.id).map(c => ({ ...c }))
    });
  }
}
