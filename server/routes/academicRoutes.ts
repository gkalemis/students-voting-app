import { Router } from 'express';
import { db, effectiveBranding } from '../db';
import { authMiddleware, adminMiddleware } from '../middleware';
import { User, AcademicPeriod, Course, StudentGroup, Student } from '../types';

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

academicRouter.post('/courses', authMiddleware, (req, res) => {
  const user = (req as any).user as User;
  const c: Course = {
    id: db.nextCourseId++,
    name: req.body.name,
    description: req.body.description || null,
    owner_id: user.id,
    period_id: Number(req.body.period_id)
  };
  db.courses.push(c);
  res.status(201).json({ id: c.id, ...req.body });
});

academicRouter.delete('/courses/:cid', adminMiddleware, (req, res) => {
  const cid = Number(req.params.cid);
  db.courses = db.courses.filter(c => c.id !== cid);
  db.groups = db.groups.filter(g => g.course_id !== cid);
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
  db.groups = db.groups.filter(g => g.id !== gid);
  db.students = db.students.filter(s => s.group_id !== gid);
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
  db.students = db.students.filter(s => s.id !== sid);
  res.status(204).send();
});
