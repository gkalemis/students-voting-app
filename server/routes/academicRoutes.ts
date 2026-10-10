import { Router } from 'express';
import { db, effectiveBranding } from '../db';
import { authMiddleware, adminMiddleware } from '../middleware';
import { User, AcademicPeriod, Course, StudentGroup, Student } from '../types';
import { broadcastSession } from '../ws';

export const academicRouter = Router();

// Periods
academicRouter.get('/periods', authMiddleware, (req, res) => {
  res.json(db.periods.map(p => ({ id: p.id, name: p.name })));
});

academicRouter.post('/periods', authMiddleware, (req, res) => {
  const user = (req as any).user as User;
  const p: AcademicPeriod = {
    id: db.nextPeriodId++,
    name: req.body.name,
    owner_id: user.id
  };
  db.periods.push(p);
  res.status(201).json({ id: p.id, name: p.name });
});

academicRouter.delete('/periods/:pid', adminMiddleware, (req, res) => {
  const pid = Number(req.params.pid);
  db.periods = db.periods.filter(p => p.id !== pid);
  db.courses = db.courses.filter(c => c.period_id !== pid);
  db.groups = db.groups.filter(g => g.period_id !== pid);
  res.status(204).send();
});

import { cleanupGhostPresentations } from './sessionRoutes';

// Helper functions for consistent deletion of students, groups, and courses everywhere
export function deleteStudentEverywhere(studentId: number) {
  const student = db.students.find(s => s.id === studentId);
  const studentName = student ? student.full_name : null;

  // 1. Remove from students roster
  db.students = db.students.filter(s => s.id !== studentId);

  // 2. Locate all presentations created for this student across sessions
  const matchingPres = db.presentations.filter(p => 
    p.student_id === studentId || 
    (studentName && p.presenter_name && p.presenter_name.trim().toLowerCase() === studentName.trim().toLowerCase())
  );
  const presIds = matchingPres.map(p => p.id);
  const affectedSessionIds = [...new Set(matchingPres.map(p => p.session_id))];

  // 3. Remove all votes recorded for those presentations
  if (presIds.length > 0) {
    db.votes = db.votes.filter(v => !presIds.includes(v.presentation_id));
    db.anonymousVoteScores = db.anonymousVoteScores.filter(v => !presIds.includes(v.presentation_id));
  }

  // 4. Remove presentations
  db.presentations = db.presentations.filter(p => !presIds.includes(p.id));

  // 5. Run cleanupGhostPresentations on all sessions
  db.sessions.forEach(s => {
    cleanupGhostPresentations(s.id);
    affectedSessionIds.push(s.id);
  });

  // 6. Re-index presentation positions for affected sessions and broadcast live update
  [...new Set(affectedSessionIds)].forEach(sessionId => {
    const sessionPres = db.presentations
      .filter(p => p.session_id === sessionId)
      .sort((a, b) => a.position - b.position);
    sessionPres.forEach((p, idx) => {
      p.position = idx;
    });
    const s = db.sessions.find(x => x.id === sessionId);
    if (s) {
      broadcastSession(s.public_id, 'state_changed');
    }
  });
}

export function deleteGroupEverywhere(groupId: number) {
  const studentsInGroup = db.students.filter(s => s.group_id === groupId);
  studentsInGroup.forEach(st => {
    deleteStudentEverywhere(st.id);
  });
  db.groups = db.groups.filter(g => g.id !== groupId);
}

export function deleteCourseEverywhere(courseId: number) {
  const groupsInCourse = db.groups.filter(g => g.course_id === courseId);
  groupsInCourse.forEach(g => {
    deleteGroupEverywhere(g.id);
  });
  db.courses = db.courses.filter(c => c.id !== courseId);
}

// Courses
academicRouter.get('/courses', authMiddleware, (req, res) => {
  res.json(db.courses.map(c => ({
    id: c.id,
    name: c.name,
    description: c.description,
    owner_id: c.owner_id,
    period_id: c.period_id,
    branding: effectiveBranding(c)
  })));
});

// Course creation is completely independent of period
academicRouter.post('/courses', authMiddleware, (req, res) => {
  const user = (req as any).user as User;
  const periodId = req.body.period_id ? Number(req.body.period_id) : undefined;
  const c: Course = {
    id: db.nextCourseId++,
    name: req.body.name,
    description: req.body.description || null,
    owner_id: user.id,
    period_id: periodId
  };
  db.courses.push(c);
  res.status(201).json({ id: c.id, ...req.body, period_id: periodId });
});

academicRouter.delete('/courses/:cid', adminMiddleware, (req, res) => {
  const cid = Number(req.params.cid);
  deleteCourseEverywhere(cid);
  res.status(204).send();
});

// Groups
academicRouter.get('/groups', authMiddleware, (req, res) => {
  res.json(db.groups.map(g => ({
    id: g.id,
    title: g.title,
    course_id: g.course_id,
    period_id: g.period_id,
    presentation_date: g.presentation_date
  })));
});

academicRouter.post('/groups', authMiddleware, (req, res) => {
  const user = (req as any).user as User;
  const g: StudentGroup = {
    id: db.nextGroupId++,
    title: req.body.title,
    course_id: Number(req.body.course_id),
    period_id: Number(req.body.period_id),
    owner_id: user.id,
    presentation_date: req.body.presentation_date || null
  };
  db.groups.push(g);
  res.status(201).json({ id: g.id, ...req.body });
});

academicRouter.delete('/groups/:gid', adminMiddleware, (req, res) => {
  const gid = Number(req.params.gid);
  deleteGroupEverywhere(gid);
  res.status(204).send();
});

// Students
academicRouter.get('/groups/students', authMiddleware, (req, res) => {
  const gid = Number(req.query.gid || req.query.group_id);
  const students = gid ? db.students.filter(s => s.group_id === gid) : db.students;
  res.json(students.map(s => ({
    id: s.id,
    group_id: s.group_id,
    full_name: s.full_name,
    presentation_title: s.presentation_title
  })));
});

// Fallback student creation route if called with body groupId
academicRouter.post('/groups/students', authMiddleware, (req, res) => {
  const gid = Number(req.body.group_id || req.body.groupId || req.query.gid || db.groups[0]?.id);
  if (!gid) {
    return res.status(400).json({ error: 'Η ομάδα είναι υποχρεωτική' });
  }
  const group = db.groups.find(g => g.id === gid);
  if (!group) {
    return res.status(404).json({ error: 'Η ομάδα δεν βρέθηκε' });
  }
  const fullName = (req.body.full_name || '').trim();
  if (!fullName) {
    return res.status(400).json({ error: 'Το ονοματεπώνυμο είναι υποχρεωτικό' });
  }
  const s: Student = {
    id: db.nextStudentId++,
    group_id: gid,
    full_name: fullName,
    presentation_title: req.body.presentation_title ? String(req.body.presentation_title).trim() : null
  };
  db.students.push(s);
  res.status(201).json({ id: s.id, full_name: s.full_name, presentation_title: s.presentation_title });
});

academicRouter.get('/groups/:gid/students', authMiddleware, (req, res) => {
  const gid = Number(req.params.gid);
  const students = db.students.filter(s => s.group_id === gid);
  res.json(students.map(s => ({
    id: s.id,
    full_name: s.full_name,
    presentation_title: s.presentation_title
  })));
});

academicRouter.post('/groups/:gid/students', authMiddleware, (req, res) => {
  const gid = Number(req.params.gid);
  if (isNaN(gid) || !gid) {
    return res.status(400).json({ error: 'Μη έγκυρο αναγνωριστικό ομάδας' });
  }
  const group = db.groups.find(g => g.id === gid);
  if (!group) {
    return res.status(404).json({ error: 'Η ομάδα δεν βρέθηκε' });
  }
  const fullName = (req.body.full_name || '').trim();
  if (!fullName) {
    return res.status(400).json({ error: 'Το ονοματεπώνυμο είναι υποχρεωτικό' });
  }
  const s: Student = {
    id: db.nextStudentId++,
    group_id: gid,
    full_name: fullName,
    presentation_title: req.body.presentation_title ? String(req.body.presentation_title).trim() : null
  };
  db.students.push(s);
  res.status(201).json({ id: s.id, full_name: s.full_name, presentation_title: s.presentation_title });
});

academicRouter.delete('/groups/:gid/students/:sid', authMiddleware, (req, res) => {
  const sid = Number(req.params.sid);
  deleteStudentEverywhere(sid);
  res.status(204).send();
});

academicRouter.delete('/students/:sid', authMiddleware, (req, res) => {
  const sid = Number(req.params.sid);
  deleteStudentEverywhere(sid);
  res.status(204).send();
});
