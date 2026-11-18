import { db } from './db';
import { PollQuestionResult, PollResultDistribution, PollSession } from './pollTypes';

export function canAccessPoll(user: { id: number; role: string }, poll: PollSession): boolean {
  return user.role === 'ADMIN' || poll.owner_id === user.id;
}

export function resolvePollCourseAndPeriod(
  user: { id: number; role: string },
  input: {
    course_id?: unknown;
    period_id?: unknown;
    course_name?: unknown;
    period_name?: unknown;
  },
  fallback?: { course_id: number; period_id: number; course_name?: string; period_name?: string }
): { ok: true; course_id: number; period_id: number; course_name: string; period_name: string } | { ok: false; status: number; detail: string } {
  const cleanCourseName = typeof input.course_name === 'string' ? input.course_name.trim().slice(0, 150) : '';
  const cleanPeriodName = typeof input.period_name === 'string' ? input.period_name.trim().slice(0, 150) : '';
  const isOwnerOrAdmin = (ownerId?: number | null) => user.role === 'ADMIN' || ownerId === user.id;
  const inputCourseId = input.course_id ? Number(input.course_id) : undefined;
  const existingInputCourse = inputCourseId ? db.courses.find(c => c.id === inputCourseId) : undefined;
  if (inputCourseId && !existingInputCourse) return { ok:false,status:404,detail:'Το μάθημα δεν βρέθηκε' };
  if (existingInputCourse && !isOwnerOrAdmin(existingInputCourse.owner_id)) return { ok:false,status:403,detail:'Δεν έχετε δικαίωμα σε αυτό το μάθημα' };

  let resolvedPeriodId = fallback?.period_id || 0;
  let resolvedPeriodName = fallback?.period_name || '';
  if (cleanPeriodName) {
    let pr = db.periods.find(p => p.name.toLowerCase() === cleanPeriodName.toLowerCase() && isOwnerOrAdmin(p.owner_id));
    if (!pr) {
      pr = { id: db.nextPeriodId++, name: cleanPeriodName, owner_id: user.id };
      db.periods.push(pr);
    }
    resolvedPeriodId = pr.id;
    resolvedPeriodName = pr.name;
  } else if (input.period_id) {
    const pid = Number(input.period_id);
    const pr = db.periods.find(p => p.id === pid);
    if (!pr) return { ok: false, status: 404, detail: 'Η ακαδημαϊκή περίοδος δεν βρέθηκε' };
    if (!isOwnerOrAdmin(pr.owner_id)) return { ok: false, status: 403, detail: 'Δεν έχετε δικαίωμα σε αυτή την περίοδο' };
    resolvedPeriodId = pr.id;
    resolvedPeriodName = pr.name;
  }

  let resolvedCourseId = fallback?.course_id || 0;
  let resolvedCourseName = fallback?.course_name || '';
  if (cleanCourseName) {
    let cr = db.courses.find(c => c.period_id === resolvedPeriodId && c.name.toLowerCase() === cleanCourseName.toLowerCase() && isOwnerOrAdmin(c.owner_id));
    if (!cr) {
      cr = { id: db.nextCourseId++, name: cleanCourseName, description: null, period_id: resolvedPeriodId || null, owner_id: user.id };
      db.courses.push(cr);
    }
    resolvedCourseId = cr.id;
    resolvedCourseName = cr.name;
  } else if (input.course_id) {
    const cid = Number(input.course_id);
    const cr = db.courses.find(c => c.id === cid);
    if (!cr) return { ok: false, status: 404, detail: 'Το μάθημα δεν βρέθηκε' };
    if (!isOwnerOrAdmin(cr.owner_id)) return { ok: false, status: 403, detail: 'Δεν έχετε δικαίωμα σε αυτό το μάθημα' };
    if (cr.period_id != null && cr.period_id !== resolvedPeriodId) return { ok:false,status:400,detail:'Μη έγκυρη ακαδημαϊκή δομή' };
    resolvedCourseId = cr.id;
    resolvedCourseName = cr.name;
  }

  return {
    ok: true,
    course_id: resolvedCourseId,
    period_id: resolvedPeriodId,
    course_name: resolvedCourseName,
    period_name: resolvedPeriodName
  };
}

export function sanitizePollQuestionInput(q: any, idx: number) {
  const isTF = q?.type === 'TRUE_FALSE';
  const rawOptions = Array.isArray(q?.options) ? q.options : [];
  const cleanedOptions = rawOptions
    .map((o: unknown) => String(o ?? '').trim().slice(0, 300))
    .filter((o: string) => o.length > 0)
    .slice(0, 20);
  const options = isTF
    ? ['Σωστό', 'Λάθος']
    : (cleanedOptions.length >= 2 ? cleanedOptions : ['Επιλογή 1', 'Επιλογή 2']);

  let correctIdx: number | null = null;
  if (q?.correct_option_index !== undefined && q?.correct_option_index !== null && q?.correct_option_index !== '') {
    const parsed = Number(q.correct_option_index);
    if (Number.isInteger(parsed) && parsed >= 0 && parsed < options.length) {
      correctIdx = parsed;
    }
  }

  return {
    type: isTF ? ('TRUE_FALSE' as const) : ('MULTIPLE_CHOICE' as const),
    text: String(q?.text || `Ερώτηση ${idx + 1}`).trim().slice(0, 1000),
    options,
    correct_option_index: correctIdx
  };
}

export function calculatePollQuestionResults(questionId: number): PollQuestionResult | null {
  const q = db.pollQuestions.find(x => x.id === questionId);
  if (!q) return null;

  const answers = db.pollAnswers.filter(a => a.question_id === questionId);
  const totalVotes = answers.length;

  const counts: Record<number, number> = {};
  for (let i = 0; i < q.options.length; i++) {
    counts[i] = 0;
  }
  for (const a of answers) {
    if (a.selected_index >= 0 && a.selected_index < q.options.length) {
      counts[a.selected_index] = (counts[a.selected_index] || 0) + 1;
    }
  }

  const distribution: PollResultDistribution[] = q.options.map((optText, idx) => {
    const count = counts[idx] || 0;
    const percentage = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
    return {
      option_index: idx,
      option_text: optText,
      count,
      percentage,
      is_correct: q.correct_option_index !== null && q.correct_option_index !== undefined ? q.correct_option_index === idx : undefined
    };
  });

  return {
    question_id: q.id,
    question_text: q.text,
    type: q.type,
    total_votes: totalVotes,
    correct_option_index: q.correct_option_index,
    distribution
  };
}
