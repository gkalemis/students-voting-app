import { Router } from 'express';
import { db } from '../db';
import { authMiddleware } from '../middleware';
import { User, Student } from '../types';

export const studentRouter = Router();

export function deleteStudentEverywhere(studentId: number) {
  db.students = db.students.filter(s => s.id !== studentId);
}

function studentInput(body: any) {
  const fullName = String(body.full_name || '').trim();
  const presentationTitle = body.presentation_title ? String(body.presentation_title).trim() : null;
  if (!fullName || fullName.length > 200 || (presentationTitle?.length || 0) > 300) return null;
  return { fullName, presentationTitle };
}

// Students listing
studentRouter.get('/groups/students', authMiddleware, (req, res) => {
  const user = (req as any).user as User;
  const gid = Number(req.query.gid || req.query.group_id);
  let students = gid ? db.students.filter(s => s.group_id === gid) : db.students;
  if (user.role !== 'ADMIN') {
    const userGroupIds = new Set(db.groups.filter(g => g.owner_id === user.id).map(g => g.id));
    students = students.filter(s => userGroupIds.has(s.group_id));
  }
  res.json(students.map(s => ({
    id: s.id,
    group_id: s.group_id,
    full_name: s.full_name,
    presentation_title: s.presentation_title
  })));
});

studentRouter.post('/groups/students', authMiddleware, (req, res) => {
  const user = (req as any).user as User;
  const gid = Number(req.body.group_id || req.body.groupId || req.query.gid);
  if (!gid) {
    return res.status(400).json({ error: 'Η ομάδα είναι υποχρεωτική' });
  }
  const group = db.groups.find(g => g.id === gid);
  if (!group) {
    return res.status(404).json({ error: 'Η ομάδα δεν βρέθηκε' });
  }
  if (user.role !== 'ADMIN' && group.owner_id !== user.id) {
    return res.status(403).json({ error: 'Δεν έχετε δικαίωμα' });
  }

  const input = studentInput(req.body);
  if (!input) return res.status(400).json({ error: 'Μη έγκυρα στοιχεία φοιτητή' });
  const s: Student = {
    id: db.nextStudentId++,
    group_id: gid,
    full_name: input.fullName,
    presentation_title: input.presentationTitle
  };
  db.students.push(s);
  res.status(201).json({ id: s.id, full_name: s.full_name, presentation_title: s.presentation_title });
});

studentRouter.get('/groups/:gid/students', authMiddleware, (req, res) => {
  const user = (req as any).user as User;
  const gid = Number(req.params.gid);
  const group = db.groups.find(g => g.id === gid);
  if (!group) return res.status(404).json({ error: 'Η ομάδα δεν βρέθηκε' });
  if (user.role !== 'ADMIN' && group.owner_id !== user.id) {
    return res.status(403).json({ error: 'Δεν έχετε δικαίωμα' });
  }
  const students = db.students.filter(s => s.group_id === gid);
  res.json(students.map(s => ({
    id: s.id,
    full_name: s.full_name,
    presentation_title: s.presentation_title
  })));
});

studentRouter.post('/groups/:gid/students', authMiddleware, (req, res) => {
  const user = (req as any).user as User;
  const gid = Number(req.params.gid);
  if (isNaN(gid) || !gid) {
    return res.status(400).json({ error: 'Μη έγκυρο αναγνωριστικό ομάδας' });
  }
  const group = db.groups.find(g => g.id === gid);
  if (!group) {
    return res.status(404).json({ error: 'Η ομάδα δεν βρέθηκε' });
  }
  if (user.role !== 'ADMIN' && group.owner_id !== user.id) {
    return res.status(403).json({ error: 'Δεν έχετε δικαίωμα' });
  }
  const input = studentInput(req.body);
  if (!input) return res.status(400).json({ error: 'Μη έγκυρα στοιχεία φοιτητή' });
  const s: Student = {
    id: db.nextStudentId++,
    group_id: gid,
    full_name: input.fullName,
    presentation_title: input.presentationTitle
  };
  db.students.push(s);
  res.status(201).json({ id: s.id, full_name: s.full_name, presentation_title: s.presentation_title });
});

studentRouter.delete('/groups/:gid/students/:sid', authMiddleware, (req, res) => {
  const user = (req as any).user as User;
  const gid = Number(req.params.gid);
  const group = db.groups.find(g => g.id === gid);
  if (!group) return res.status(404).json({ error: 'Η ομάδα δεν βρέθηκε' });
  if (user.role !== 'ADMIN' && group.owner_id !== user.id) {
    return res.status(403).json({ error: 'Δεν έχετε δικαίωμα' });
  }
  const sid = Number(req.params.sid);
  const student = db.students.find(s => s.id === sid && s.group_id === gid);
  if (!student) return res.status(404).json({ error: 'Δεν βρέθηκε' });
  deleteStudentEverywhere(sid);
  res.status(204).send();
});

studentRouter.delete('/students/:sid', authMiddleware, (req, res) => {
  const user = (req as any).user as User;
  const sid = Number(req.params.sid);
  const student = db.students.find(s => s.id === sid);
  if (!student) return res.status(404).json({ error: 'Δεν βρέθηκε' });
  if (user.role !== 'ADMIN') {
    const group = db.groups.find(g => g.id === student.group_id);
    if (!group || group.owner_id !== user.id) {
      return res.status(403).json({ error: 'Δεν έχετε δικαίωμα' });
    }
  }
  deleteStudentEverywhere(sid);
  res.status(204).send();
});
