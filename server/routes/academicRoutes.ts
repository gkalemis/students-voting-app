import { Router } from 'express';
import { db, effectiveBranding } from '../db';
import { authMiddleware } from '../middleware';
import { User, AcademicPeriod, Course, StudentGroup } from '../types';
import { deleteSessionEverywhere } from './sessionRoutes';
import { deleteStudentEverywhere } from './studentRoutes';

export const academicRouter = Router();

// Periods
academicRouter.get('/periods', authMiddleware, (req, res) => {
  const user = (req as any).user as User;
  const list = user.role === 'ADMIN' ? db.periods : db.periods.filter(p => p.owner_id === user.id);
  res.json(list.map(p => ({ id: p.id, name: p.name, owner_id: p.owner_id })));
});

academicRouter.post('/periods', authMiddleware, (req, res) => {
  const user = (req as any).user as User;
  const name = String(req.body.name || '').trim();
  if (!name || name.length > 200) return res.status(400).json({ error: 'Μη έγκυρο όνομα περιόδου' });
  const p: AcademicPeriod = {
    id: db.nextPeriodId++,
    name,
    owner_id: user.id
  };
  db.periods.push(p);
  res.status(201).json({ id: p.id, name: p.name, owner_id: p.owner_id });
});

export function deletePeriodEverywhere(periodId: number) {
  const coursesInPeriod = db.courses.filter(c => c.period_id === periodId);
  coursesInPeriod.forEach(c => deleteCourseEverywhere(c.id));
  const groupsInPeriod = db.groups.filter(g => g.period_id === periodId);
  groupsInPeriod.forEach(g => deleteGroupEverywhere(g.id));
  db.periods = db.periods.filter(p => p.id !== periodId);
}

academicRouter.delete('/periods/:pid', authMiddleware, (req, res) => {
  const user = (req as any).user as User;
  const pid = Number(req.params.pid);
  const period = db.periods.find(p => p.id === pid);
  if (!period) return res.status(404).json({ error: 'Δεν βρέθηκε' });
  if (user.role !== 'ADMIN' && period.owner_id !== user.id) {
    return res.status(403).json({ error: 'Δεν έχετε δικαίωμα διαγραφής αυτής της περιόδου' });
  }
  deletePeriodEverywhere(pid);
  res.status(204).send();
});

// Helper functions for consistent cascading deletion everywhere
export function deleteGroupEverywhere(groupId: number) {
  // 1. Remove all students belonging to this group from the students roster
  db.students = db.students.filter(s => s.group_id !== groupId);
  // 2. Remove group from groups list (sessions are independent and completely unaffected)
  db.groups = db.groups.filter(g => g.id !== groupId);
}

export function deleteCourseEverywhere(courseId: number) {
  const groupsInCourse = db.groups.filter(g => g.course_id === courseId);
  groupsInCourse.forEach(g => {
    deleteGroupEverywhere(g.id);
  });
  const sessionsInCourse = db.sessions.filter(s => s.course_id === courseId);
  sessionsInCourse.forEach(s => {
    deleteSessionEverywhere(s.id);
  });
  db.courses = db.courses.filter(c => c.id !== courseId);
}

// Courses
academicRouter.get('/courses', authMiddleware, (req, res) => {
  const user = (req as any).user as User;
  const list = user.role === 'ADMIN' ? db.courses : db.courses.filter(c => c.owner_id === user.id);
  res.json(list.map(c => ({
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
  const periodId = req.body.period_id ? Number(req.body.period_id) : undefined;
  const name = String(req.body.name || '').trim();
  const period = db.periods.find(p => p.id === periodId);
  if (!name || name.length > 200 || !period) return res.status(400).json({ error: 'Μη έγκυρα στοιχεία μαθήματος' });
  if (user.role !== 'ADMIN' && period.owner_id !== user.id) return res.status(403).json({ error: 'Δεν έχετε δικαίωμα' });
  const c: Course = {
    id: db.nextCourseId++,
    name,
    description: req.body.description || null,
    owner_id: user.id,
    period_id: periodId
  };
  db.courses.push(c);
  res.status(201).json({ id: c.id, ...req.body, period_id: periodId });
});

academicRouter.delete('/courses/:cid', authMiddleware, (req, res) => {
  const user = (req as any).user as User;
  const cid = Number(req.params.cid);
  const course = db.courses.find(c => c.id === cid);
  if (!course) return res.status(404).json({ error: 'Δεν βρέθηκε' });
  if (user.role !== 'ADMIN' && course.owner_id !== user.id) {
    return res.status(403).json({ error: 'Δεν έχετε δικαίωμα διαγραφής αυτού του μαθήματος' });
  }
  deleteCourseEverywhere(cid);
  res.status(204).send();
});

// Groups
academicRouter.get('/groups', authMiddleware, (req, res) => {
  const user = (req as any).user as User;
  const list = user.role === 'ADMIN' ? db.groups : db.groups.filter(g => g.owner_id === user.id);
  res.json(list.map(g => ({
    id: g.id,
    title: g.title,
    course_id: g.course_id,
    period_id: g.period_id,
    owner_id: g.owner_id,
    presentation_date: g.presentation_date
  })));
});

academicRouter.post('/groups', authMiddleware, (req, res) => {
  const user = (req as any).user as User;
  const courseId = Number(req.body.course_id);
  const course = db.courses.find(c => c.id === courseId);
  if (!course) return res.status(400).json({ error: 'Το μάθημα δεν βρέθηκε' });
  if (user.role !== 'ADMIN' && course.owner_id !== user.id) {
    return res.status(403).json({ error: 'Δεν έχετε δικαίωμα προσθήκης ομάδας σε αυτό το μάθημα' });
  }
  const periodId = Number(req.body.period_id);
  const period = db.periods.find(p => p.id === periodId);
  const title = String(req.body.title || '').trim();
  if (!period || course.period_id !== periodId || !title || title.length > 200) {
    return res.status(400).json({ error: 'Μη έγκυρα στοιχεία ομάδας' });
  }
  if (user.role !== 'ADMIN' && period.owner_id !== user.id) return res.status(403).json({ error: 'Δεν έχετε δικαίωμα' });

  const g: StudentGroup = {
    id: db.nextGroupId++,
    title,
    course_id: courseId,
    period_id: periodId,
    owner_id: user.id,
    presentation_date: req.body.presentation_date || null
  };
  db.groups.push(g);
  res.status(201).json({ id: g.id, ...req.body });
});

academicRouter.delete('/groups/:gid', authMiddleware, (req, res) => {
  const user = (req as any).user as User;
  const gid = Number(req.params.gid);
  const group = db.groups.find(g => g.id === gid);
  if (!group) return res.status(404).json({ error: 'Δεν βρέθηκε' });
  if (user.role !== 'ADMIN' && group.owner_id !== user.id) {
    return res.status(403).json({ error: 'Δεν έχετε δικαίωμα διαγραφής αυτής της ομάδας' });
  }
  deleteGroupEverywhere(gid);
  res.status(204).send();
});
