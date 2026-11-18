import { Router } from 'express';
import { db, calculateResults } from '../db';
import { authMiddleware } from '../middleware';

export const exportRouter = Router();

import { sanitizeCsvCell } from '../security';

// CSV / Excel Export
exportRouter.get('/sessions/:sid/export.:ext', authMiddleware, (req, res) => {
  const sid = Number(req.params.sid);
  const s = db.sessions.find(x => x.id === sid);
  if (!s) return res.status(404).json({ detail: 'Δεν βρέθηκε' });

  const user = (req as any).user;
  if (user.role !== 'ADMIN' && s.owner_id !== user.id) {
    return res.status(403).json({ detail: 'Δεν έχετε δικαίωμα εξαγωγής αυτής της συνεδρίας' });
  }

  const course = db.courses.find(c => c.id === s.course_id);
  const period = db.periods.find(p => p.id === s.period_id);
  const group = db.groups.find(g => g.id === s.group_id);
  const rows = calculateResults(sid);

  let csvContent = '\ufeffCourse,Academic Period,Group,Session Date,Presenter,Presentation Title,Status,Valid Votes,Weighted Score,Rank\n';
  for (const r of rows) {
    csvContent += [
      sanitizeCsvCell(course?.name || ''),
      sanitizeCsvCell(period?.name || ''),
      sanitizeCsvCell(group?.title || ''),
      sanitizeCsvCell(s.session_date),
      sanitizeCsvCell(r.presenter_name),
      sanitizeCsvCell(r.title || ''),
      sanitizeCsvCell(r.status),
      r.vote_count,
      r.weighted_score ?? '',
      r.rank ?? ''
    ].join(',') + '\n';
  }

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="session-${sid}.csv"`);
  res.send(csvContent);
});
