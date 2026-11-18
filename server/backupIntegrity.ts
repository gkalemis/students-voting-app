import { validSessionDate } from './dates';

export function validateBackupIntegrity(data: any): string | null {
  const names = ['users','periods','courses','groups','students','sessions','criteria','presentations','tokens','votes','anonymousVoteScores'];
  for (const name of names) if (!Array.isArray(data[name])) return `Missing backup table: ${name}`;
  for (const name of ['polls','pollQuestions','pollAnswers']) data[name] ??= [];
  const ids: Record<string, Set<number>> = {};
  for (const name of [...names.filter(n => n !== 'anonymousVoteScores'),'polls','pollQuestions','pollAnswers']) {
    ids[name] = new Set();
    for (const item of data[name]) {
      if (!item || !Number.isSafeInteger(item.id) || item.id <= 0 || ids[name].has(item.id)) return `Invalid or duplicate ID: ${name}`;
      ids[name].add(item.id);
    }
  }
  const usernames = new Set<string>();
  for (const user of data.users) {
    if (!/^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/.test(user.password_hash)) return 'Invalid password hash';
    const name = user.username.trim().toLowerCase();
    if (usernames.has(name)) return 'Duplicate username';
    usernames.add(name);
    if (user.auth_version !== undefined && (!Number.isSafeInteger(user.auth_version) || user.auth_version < 0)) return 'Invalid authentication version';
    if (user.must_change_password !== undefined && typeof user.must_change_password !== 'boolean') return 'Invalid password state';
    if (typeof user.active !== 'boolean') return 'Invalid account state';
  }
  const references: Record<string, Record<string,string>> = {
    periods:{owner_id:'users'},courses:{owner_id:'users'},groups:{owner_id:'users',course_id:'courses',period_id:'periods'},
    students:{group_id:'groups'},sessions:{owner_id:'users',course_id:'courses',period_id:'periods'},
    criteria:{session_id:'sessions'},presentations:{session_id:'sessions'},tokens:{session_id:'sessions'},
    votes:{presentation_id:'presentations',token_id:'tokens'},polls:{owner_id:'users',course_id:'courses',period_id:'periods'},
    pollQuestions:{poll_id:'polls'},pollAnswers:{poll_id:'polls',question_id:'pollQuestions'}
  };
  for (const [table, fields] of Object.entries(references)) {
    for (const item of data[table]) for (const [field, target] of Object.entries(fields)) {
      if (!ids[target].has(item[field])) return `Invalid reference: ${table}.${field}`;
    }
  }
  for (const name of ['sessions','polls']) for (const item of data[name]) {
    if (!validSessionDate(item.session_date)) return 'Invalid session date';
  }
  for (const q of data.pollQuestions) {
    if (!['TRUE_FALSE','MULTIPLE_CHOICE'].includes(q.type) || typeof q.text !== 'string' || !Array.isArray(q.options) || q.options.length < 2 || q.options.length > 20 || q.options.some((o: unknown) => typeof o !== 'string')) return 'Invalid poll question';
    if (!['PENDING','OPEN','CLOSED','SKIPPED'].includes(q.status)) return 'Invalid question status';
  }
  for (const poll of data.polls) {
    if (!['DRAFT','ACTIVE','COMPLETED','ARCHIVED'].includes(poll.status)) return 'Invalid poll status';
    if (poll.active_question_id != null && !data.pollQuestions.some((q: any) => q.id === poll.active_question_id && q.poll_id === poll.id)) return 'Invalid active question';
  }
  for (const answer of data.pollAnswers) {
    const q = data.pollQuestions.find((q: any) => q.id === answer.question_id && q.poll_id === answer.poll_id);
    if (!q || !Number.isInteger(answer.selected_index) || answer.selected_index < 0 || answer.selected_index >= q.options.length) return 'Invalid poll answer';
  }
  return null;
}
