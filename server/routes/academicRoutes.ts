import { Router } from 'express';
import { db, effectiveBranding } from '../db';
import { authMiddleware } from '../middleware';
import { parsePositiveInt } from '../security';
import { User, AcademicPeriod, Course, StudentGroup } from '../types';
import { deleteSessionEverywhere } from './sessionRoutes';

export const academicRouter = Router();

const canOwn = (user: User, ownerId?: number | null) => user.role === 'ADMIN' || ownerId === user.id;

function getOwnerName(ownerId?: number | null): string {
  if (!ownerId) return '';
  const user = db.users.find(u => u.id === ownerId);
  return user ? (user.full_name || user.username) : '';
}

academicRouter.get('/periods', authMiddleware, (req, res) => {
  const user = (req as any).user as User;
  const list = user.role === 'ADMIN' ? db.periods : db.periods.filter(p => p.owner_id === user.id);
  res.json(list.map(p => ({ id: p.id, name: p.name, owner_id: p.owner_id, owner_name: getOwnerName(p.owner_id) })));
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

const updatePeriod = (req: any, res: any) => {
  const user = req.user as User;
  const pid = parsePositiveInt(req.params.pid);
  const period = pid ? db.periods.find(p => p.id === pid) : undefined;
  if (!period) return res.status(404).json({ error: 'Δεν βρέθηκε' });
  if (!canOwn(user, period.owner_id)) {
    return res.status(403).json({ error: 'Δεν έχετε δικαίωμα επεξεργασίας αυτής της περιόδου' });
  }
  const name = String(req.body.name || '').trim();
  if (!name) return res.status(400).json({ error: 'Το όνομα περιόδου είναι υποχρεωτικό' });
  period.name = name;
  res.json({ id: period.id, name: period.name, owner_id: period.owner_id, owner_name: getOwnerName(period.owner_id) });
};
academicRouter.put('/periods/:pid', authMiddleware, updatePeriod);
academicRouter.patch('/periods/:pid', authMiddleware, updatePeriod);

export function deleteGroupEverywhere(groupId: number) {
  db.students = db.students.filter(s => s.group_id !== groupId);
  db.groups = db.groups.filter(g => g.id !== groupId);
}

export function deleteCourseEverywhere(courseId: number) {
  const pollIds = new Set(db.polls.filter(p => p.course_id === courseId).map(p => p.id));
  db.pollAnswers = db.pollAnswers.filter(a => !pollIds.has(a.poll_id));
  db.pollQuestions = db.pollQuestions.filter(q => !pollIds.has(q.poll_id));
  db.polls = db.polls.filter(p => !pollIds.has(p.id));
  db.groups.filter(g => g.course_id === courseId).forEach(g => deleteGroupEverywhere(g.id));
  db.sessions.filter(s => s.course_id === courseId).forEach(s => deleteSessionEverywhere(s.id));
  db.courses = db.courses.filter(c => c.id !== courseId);
}

export function deletePeriodEverywhere(periodId: number) {
  db.courses.filter(c => c.period_id === periodId).forEach(c => deleteCourseEverywhere(c.id));
  db.groups.filter(g => g.period_id === periodId).forEach(g => deleteGroupEverywhere(g.id));
  db.periods = db.periods.filter(p => p.id !== periodId);
}

academicRouter.delete('/periods/:pid', authMiddleware, (req, res) => {
  const user = (req as any).user as User;
  const pid = parsePositiveInt(req.params.pid);
  const period = pid ? db.periods.find(p => p.id === pid) : undefined;
  if (!period) return res.status(404).json({ error: 'Δεν βρέθηκε' });
  if (!canOwn(user, period.owner_id)) {
    return res.status(403).json({ error: 'Δεν έχετε δικαίωμα διαγραφής αυτής της περιόδου' });
  }
  deletePeriodEverywhere(pid!);
  res.status(204).send();
});

academicRouter.get('/courses', authMiddleware, (req, res) => {
  const user = (req as any).user as User;
  const list = user.role === 'ADMIN' ? db.courses : db.courses.filter(c => c.owner_id === user.id);
  res.json(list.map(c => ({
    id: c.id, name: c.name, description: c.description, owner_id: c.owner_id,
    owner_name: getOwnerName(c.owner_id), period_id: c.period_id, branding: effectiveBranding(c)
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
  res.status(201).json({ id: c.id, name: c.name, description: c.description, owner_id: c.owner_id, period_id: c.period_id, owner_name: getOwnerName(c.owner_id), branding: effectiveBranding(c) });
});

const updateCourse = (req: any, res: any) => {
  const user = req.user as User;
  const cid = parsePositiveInt(req.params.cid);
  const course = cid ? db.courses.find(c => c.id === cid) : undefined;
  if (!course) return res.status(404).json({ error: 'Δεν βρέθηκε' });
  if (!canOwn(user, course.owner_id)) {
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
  res.json({ id: course.id, name: course.name, description: course.description, period_id: course.period_id, owner_id: course.owner_id, owner_name: getOwnerName(course.owner_id), branding: effectiveBranding(course) });
};
academicRouter.put('/courses/:cid', authMiddleware, updateCourse);
academicRouter.patch('/courses/:cid', authMiddleware, updateCourse);

academicRouter.delete('/courses/:cid', authMiddleware, (req, res) => {
  const user = (req as any).user as User;
  const cid = parsePositiveInt(req.params.cid);
  const course = cid ? db.courses.find(c => c.id === cid) : undefined;
  if (!course) return res.status(404).json({ error: 'Δεν βρέθηκε' });
  if (!canOwn(user, course.owner_id)) return res.status(403).json({ error: 'Δεν έχετε δικαίωμα διαγραφής αυτού του μαθήματος' });
  deleteCourseEverywhere(cid!);
  res.status(204).send();
});

academicRouter.get('/groups', authMiddleware, (req, res) => {
  const user = (req as any).user as User;
  const list = user.role === 'ADMIN' ? db.groups : db.groups.filter(g => g.owner_id === user.id);
  res.json(list.map(g => ({ id: g.id, title: g.title, course_id: g.course_id, period_id: g.period_id, owner_id: g.owner_id, owner_name: getOwnerName(g.owner_id), presentation_date: g.presentation_date })));
});

academicRouter.post('/groups', authMiddleware, (req, res) => {
  const user = (req as any).user as User;
  const title = typeof req.body?.title === 'string' ? req.body.title.trim().slice(0, 150) : '';
  if (!title) return res.status(400).json({ error: 'Ο τίτλος ομάδας είναι υποχρεωτικός' });
  const periodId = parsePositiveInt(req.body?.period_id);
  const period = periodId ? db.periods.find(p => p.id === periodId) : undefined;
  if (!period) return res.status(400).json({ error: 'Η περίοδος είναι υποχρεωτική' });
  if (!canOwn(user, period.owner_id)) return res.status(403).json({ error: 'Δεν έχετε δικαίωμα σε αυτή την περίοδο' });

  const courseId = parsePositiveInt(req.body?.course_id);
  const course = courseId ? db.courses.find(c => c.id === courseId) : undefined;
  if (!course) return res.status(400).json({ error: 'Το μάθημα δεν βρέθηκε' });
  if (user.role !== 'ADMIN' && course.owner_id !== user.id) {
    return res.status(403).json({ error: 'Δεν έχετε δικαίωμα προσθήκης ομάδας σε αυτό το μάθημα' });
  }
  if (!period || course.period_id !== periodId || !title || title.length > 200) {
    return res.status(400).json({ error: 'Μη έγκυρα στοιχεία ομάδας' });
  }
  if (user.role !== 'ADMIN' && period.owner_id !== user.id) return res.status(403).json({ error: 'Δεν έχετε δικαίωμα' });

  const g: StudentGroup = {
    id: db.nextGroupId++,
    title,
    course_id: course.id,
    period_id: period.id,
    owner_id: user.id,
    presentation_date: req.body.presentation_date || null
  };
  db.groups.push(g);
  res.status(201).json({ id: g.id, title: g.title, course_id: g.course_id, period_id: g.period_id, owner_id: g.owner_id, presentation_date: g.presentation_date, owner_name: getOwnerName(g.owner_id) });
});

const updateGroup = (req: any, res: any) => {
  const user = req.user as User;
  const gid = parsePositiveInt(req.params.gid);
  const group = gid ? db.groups.find(g => g.id === gid) : undefined;
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
  if (req.body?.period_id !== undefined) {
    const targetPid = parsePositiveInt(req.body.period_id);
    const period = targetPid ? db.periods.find(p => p.id === targetPid) : undefined;
    if (!period) return res.status(400).json({ error: 'Η περίοδος δεν βρέθηκε' });
    if (!canOwn(user, period.owner_id)) return res.status(403).json({ error: 'Δεν έχετε δικαίωμα σε αυτή την περίοδο' });
    group.period_id = targetPid!;
  }
  group.title = title;
  if (req.body?.presentation_date !== undefined) {
    group.presentation_date = typeof req.body.presentation_date === 'string' && req.body.presentation_date.trim() ? req.body.presentation_date.trim().slice(0, 30) : null;
  }
  res.json({ id: group.id, title: group.title, course_id: group.course_id, period_id: group.period_id, owner_id: group.owner_id, owner_name: getOwnerName(group.owner_id), presentation_date: group.presentation_date });
};
academicRouter.put('/groups/:gid', authMiddleware, updateGroup);
academicRouter.patch('/groups/:gid', authMiddleware, updateGroup);

academicRouter.delete('/groups/:gid', authMiddleware, (req, res) => {
  const user = (req as any).user as User;
  const gid = parsePositiveInt(req.params.gid);
  const group = gid ? db.groups.find(g => g.id === gid) : undefined;
  if (!group) return res.status(404).json({ error: 'Δεν βρέθηκε' });
  if (!canOwn(user, group.owner_id)) return res.status(403).json({ error: 'Δεν έχετε δικαίωμα διαγραφής αυτής της ομάδας' });
  deleteGroupEverywhere(gid!);
  res.status(204).send();
});
