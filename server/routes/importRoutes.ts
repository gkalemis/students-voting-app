import { Router } from 'express';
import { db } from '../db';
import { authMiddleware } from '../middleware';
import { User, Course, StudentGroup, Student } from '../types';
import { parseCsvText, extractRows, CsvRow } from '../csvParser';

export const importRouter = Router();
importRouter.use(authMiddleware);

// 1. Full Hierarchy Import (Course -> Period -> Group -> Student)
importRouter.post('/import/hierarchy', (req, res) => {
  const user = (req as any).user as User;
  let rows: CsvRow[] = [];

  if (typeof req.body.csvText === 'string') {
    const matrix = parseCsvText(req.body.csvText);
    rows = extractRows(matrix, 'hierarchy');
  } else if (Array.isArray(req.body.rows)) {
    rows = req.body.rows;
  }

  if (!rows.length) {
    return res.status(400).json({ error: 'Δεν βρέθηκαν έγκυρες εγγραφές στο CSV.' });
  }

  let coursesCreated = 0;
  let periodsCreated = 0;
  let groupsCreated = 0;
  let studentsCreated = 0;

  for (const r of rows) {
    const periodName = (r.period || 'Τρέχουσα Περίοδος').trim();
    const courseName = (r.course || 'Γενικό Μάθημα').trim();
    const groupTitle = (r.group || 'Ομάδα 1').trim();
    const studentName = (r.full_name || '').trim();
    const presentationTitle = (r.presentation_title || '').trim() || null;

    // Period
    let period = db.periods.find(p => p.name.toLowerCase() === periodName.toLowerCase());
    if (!period) {
      period = {
        id: db.nextPeriodId++,
        name: periodName,
        owner_id: user.id
      };
      db.periods.push(period);
      periodsCreated++;
    }

    // Course
    let course = db.courses.find(c => c.period_id === period!.id && c.name.toLowerCase() === courseName.toLowerCase());
    if (!course) {
      course = {
        id: db.nextCourseId++,
        name: courseName,
        description: null,
        owner_id: user.id,
        period_id: period.id
      };
      db.courses.push(course);
      coursesCreated++;
    }

    // Group
    let group = db.groups.find(g => g.course_id === course!.id && g.period_id === period!.id && g.title.toLowerCase() === groupTitle.toLowerCase());
    if (!group) {
      group = {
        id: db.nextGroupId++,
        title: groupTitle,
        course_id: course.id,
        period_id: period.id,
        owner_id: user.id,
        presentation_date: null
      };
      db.groups.push(group);
      groupsCreated++;
    }

    // Student
    if (studentName) {
      const existingStudent = db.students.find(s => s.group_id === group!.id && s.full_name.toLowerCase() === studentName.toLowerCase());
      if (!existingStudent) {
        const student: Student = {
          id: db.nextStudentId++,
          group_id: group.id,
          full_name: studentName,
          presentation_title: presentationTitle
        };
        db.students.push(student);
        studentsCreated++;
      }
    }
  }

  res.json({
    success: true,
    summary: {
      courses_created: coursesCreated,
      periods_created: periodsCreated,
      groups_created: groupsCreated,
      students_created: studentsCreated,
      total_rows: rows.length
    }
  });
});

// 2. Students into existing group
importRouter.post('/import/students', (req, res) => {
  const groupId = Number(req.body.groupId);
  const group = db.groups.find(g => g.id === groupId);
  if (!group) {
    return res.status(404).json({ error: 'Η επιλεγμένη ομάδα δεν βρέθηκε.' });
  }

  let rows: CsvRow[] = [];
  if (typeof req.body.csvText === 'string') {
    const matrix = parseCsvText(req.body.csvText);
    rows = extractRows(matrix, 'students');
  } else if (Array.isArray(req.body.rows)) {
    rows = req.body.rows;
  }

  if (!rows.length) {
    return res.status(400).json({ error: 'Δεν βρέθηκαν φοιτητές στο CSV.' });
  }

  let created = 0;
  for (const r of rows) {
    const name = (r.full_name || '').trim();
    if (!name) continue;
    const title = (r.presentation_title || '').trim() || null;

    const existing = db.students.find(s => s.group_id === groupId && s.full_name.toLowerCase() === name.toLowerCase());
    if (!existing) {
      const student: Student = {
        id: db.nextStudentId++,
        group_id: groupId,
        full_name: name,
        presentation_title: title
      };
      db.students.push(student);
      created++;
    }
  }

  res.json({
    success: true,
    count: created,
    total_rows: rows.length
  });
});
