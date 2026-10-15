import { Router } from 'express';
import { db, effectiveBranding } from '../db';
import { authMiddleware } from '../middleware';
import { User, AcademicPeriod, Course, StudentGroup } from '../types';
import { deleteSessionEverywhere } from './sessionRoutes';

export const academicRouter = Router();

function getOwnerName(ownerId?: number | null): string {
  if (!ownerId) return '';
  const user = db.users.find(u => u.id === ownerId);
  return user ? (user.full_name || user.username) : '';
}

// Periods
academicRouter.get('/periods', authMiddleware, (req, res) => {
  const user = (req as any).user as User;
  const list = user.role === 'ADMIN' ? db.periods : db.periods.filter(p => p.owner_id === user.id);
  res.json(list.map(p => ({
    id: p.id,
    name: p.name,
    owner_id: p.owner_id,
    owner_name: getOwnerName(p.owner_id)
  })));
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
  res.status(201).json({ id: p.id, name: p.name, owner_id: p.owner_id, owner_name: getOwnerName(p.owner_id) });
});

academicRouter.put('/periods/:pid', authMiddleware, (req, res) => {
  const user = (req as any).user as User;
  const pid = Number(req.params.pid);
  const period = db.periods.find(p => p.id === pid);
  if (!period) return res.status(404).json({ error: 'Δεν βρέθηκε' });
  if (user.role !== 'ADMIN' && period.owner_id !== user.id) {
    return res.status(403).json({ error: 'Δεν έχετε δικαίωμα επεξεργασίας αυτής της περιόδου' });
  }
  const name = String(req.body.name || '').trim();
  if (!name) return res.status(400).json({ error: 'Το όνομα περιόδου είναι υποχρεωτικό' });
  period.name = name;
  res.json({ id: period.id, name: period.name, owner_id: period.owner_id, owner_name: getOwnerName(period.owner_id) });
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
  // 1. Remove all students belonging to this group from the students roster (Deleting a group deletes all the students)
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
    owner_name: getOwnerName(c.owner_id),
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
  res.status(201).json({ id: c.id, ...req.body, period_id: periodId, owner_name: getOwnerName(c.owner_id) });
});

academicRouter.put('/courses/:cid', authMiddleware, (req, res) => {
  const user = (req as any).user as User;
  const cid = Number(req.params.cid);
  const course = db.courses.find(c => c.id === cid);
  if (!course) return res.status(404).json({ error: 'Δεν βρέθηκε' });
  if (user.role !== 'ADMIN' && course.owner_id !== user.id) {
    return res.status(403).json({ error: 'Δεν έχετε δικαίωμα επεξεργασίας αυτού του μαθήματος' });
  }
  const name = String(req.body.name || '').trim();
  if (!name) return res.status(400).json({ error: 'Το όνομα μαθήματος είναι υποχρεωτικό' });
  const periodId = req.body.period_id === undefined ? course.period_id : Number(req.body.period_id);
  const period = db.periods.find(p => p.id === periodId);
  if (!period) return res.status(400).json({ error: 'Δεν βρέθηκε' });
  if (user.role !== 'ADMIN' && period.owner_id !== user.id) return res.status(403).json({ error: 'Δεν έχετε δικαίωμα' });
  course.name = name;
  if (req.body.description !== undefined) {
    course.description = req.body.description ? String(req.body.description).trim() : null;
  }
  if (req.body.period_id !== undefined) {
    course.period_id = periodId;
    db.groups.filter(g => g.course_id === cid).forEach(g => { g.period_id = period!.id; });
    db.sessions.filter(s => s.course_id === cid).forEach(s => { s.period_id = period!.id; });
  }
  res.json({
    id: course.id,
    name: course.name,
    description: course.description,
    period_id: course.period_id,
    owner_id: course.owner_id,
    owner_name: getOwnerName(course.owner_id),
    branding: effectiveBranding(course)
  });
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
    owner_name: getOwnerName(g.owner_id),
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
  res.status(201).json({ id: g.id, ...req.body, owner_name: getOwnerName(g.owner_id) });
});

academicRouter.put('/groups/:gid', authMiddleware, (req, res) => {
  const user = (req as any).user as User;
  const gid = Number(req.params.gid);
  const group = db.groups.find(g => g.id === gid);
  if (!group) return res.status(404).json({ error: 'Δεν βρέθηκε' });
  if (user.role !== 'ADMIN' && group.owner_id !== user.id) {
    return res.status(403).json({ error: 'Δεν έχετε δικαίωμα επεξεργασίας αυτής της ομάδας' });
  }
  const title = String(req.body.title || '').trim();
  if (!title) return res.status(400).json({ error: 'Ο τίτλος ομάδας είναι υποχρεωτικός' });
  const courseId = req.body.course_id === undefined ? group.course_id : Number(req.body.course_id);
  const periodId = req.body.period_id === undefined ? group.period_id : Number(req.body.period_id);
  const course = db.courses.find(c => c.id === courseId && c.period_id === periodId);
  const period = db.periods.find(p => p.id === periodId);
  if (!course || !period) return res.status(400).json({ error: 'Δεν βρέθηκε' });
  if (user.role !== 'ADMIN' && (course.owner_id !== user.id || period.owner_id !== user.id)) return res.status(403).json({ error: 'Δεν έχετε δικαίωμα' });
  group.title = title;
  if (req.body.presentation_date !== undefined) {
    group.presentation_date = req.body.presentation_date ? String(req.body.presentation_date).trim() : null;
  }
  if (req.body.course_id !== undefined) {
    group.course_id = Number(req.body.course_id);
  }
  if (req.body.period_id !== undefined) {
    group.period_id = Number(req.body.period_id);
  }
  res.json({
    id: group.id,
    title: group.title,
    course_id: group.course_id,
    period_id: group.period_id,
    owner_id: group.owner_id,
    owner_name: getOwnerName(group.owner_id),
    presentation_date: group.presentation_date
  });
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
