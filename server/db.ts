import crypto from 'crypto';
import {
  User, Branding, AcademicPeriod, Course, StudentGroup,
  Student, Criterion, Presentation, PresentationSession,
  ParticipationToken, Vote, AnonymousVoteScore
} from './types';

export const db = {
  users: [] as User[],
  globalBranding: {
    university_name: {
      el: 'Εθνικό Μετσόβιο Πολυτεχνείο',
      en: 'National Technical University of Athens'
    },
    school_name: {
      el: 'Σχολή Πολιτικών Μηχανικών',
      en: 'School of Civil Engineering'
    },
    department_name: '',
    background_type: 'none',
    background_value: '#0e2a47',
    logo_url: null,
    background_image_url: null,
    background_opacity: 0.12
  } as Branding,
  periods: [] as AcademicPeriod[],
  courses: [] as Course[],
  groups: [] as StudentGroup[],
  students: [] as Student[],
  sessions: [] as PresentationSession[],
  criteria: [] as Criterion[],
  presentations: [] as Presentation[],
  tokens: [] as ParticipationToken[],
  votes: [] as Vote[],
  anonymousVoteScores: [] as AnonymousVoteScore[],

  nextUserId: 1,
  nextPeriodId: 1,
  nextCourseId: 1,
  nextGroupId: 1,
  nextStudentId: 1,
  nextSessionId: 1,
  nextCriterionId: 1,
  nextPresentationId: 1,
  nextTokenId: 1,
  nextVoteId: 1,
};

export function hashToken(t: string): string {
  return crypto.createHash('sha256').update(t).digest('hex');
}

export function userJson(u: User) {
  return {
    id: u.id,
    username: u.username,
    full_name: u.full_name,
    role: u.role,
    active: u.active,
    must_change_password: Boolean(u.must_change_password),
    theme_color: u.theme_color
  };
}

export function effectiveBranding(course?: Course): Branding {
  const g = { ...db.globalBranding };
  if (course?.branding) {
    Object.assign(g, course.branding);
  }
  return g;
}

export function getVoteCount(presentationId: number, anonymous = false): number {
  if (anonymous) {
    const uniqueIds = new Set(
      db.anonymousVoteScores.filter(v => v.presentation_id === presentationId).map(v => v.anonymous_vote_id)
    );
    return uniqueIds.size;
  }
  return db.votes.filter(v => v.presentation_id === presentationId).length;
}

export function getDefaultCriteria(sessionId = 0): Criterion[] {
  return [
    { id: db.nextCriterionId++, session_id: sessionId, name: 'Επιστημονική τεκμηρίωση', weight: 40, position: 0 },
    { id: db.nextCriterionId++, session_id: sessionId, name: 'Σαφήνεια και οργάνωση', weight: 30, position: 1 },
    { id: db.nextCriterionId++, session_id: sessionId, name: 'Κριτική σκέψη & Απαντήσεις', weight: 30, position: 2 }
  ];
}

export function getPresentationCriteria(presentationId: number): Criterion[] {
  const p = db.presentations.find(x => x.id === presentationId);
  if (p && p.criteria && p.criteria.length > 0) {
    return p.criteria;
  }
  if (p) {
    const sessionCriteria = db.criteria.filter(c => c.session_id === p.session_id).sort((a, b) => a.position - b.position);
    if (sessionCriteria.length > 0) {
      return sessionCriteria;
    }
    const defaults = getDefaultCriteria(p.session_id);
    p.criteria = defaults;
    return defaults;
  }
  return getDefaultCriteria(0);
}

export function calculateResults(sessionId: number) {
  const criteria = db.criteria.filter(c => c.session_id === sessionId).sort((a, b) => a.position - b.position);
  const presentations = db.presentations.filter(p => p.session_id === sessionId).sort((a, b) => a.position - b.position);

  const output = presentations.map(p => {
    const anonScores = db.anonymousVoteScores.filter(s => s.presentation_id === p.id);
    const useAnon = anonScores.length > 0;
    const voteCount = getVoteCount(p.id, useAnon);

    const means = criteria.map(c => {
      let mean: number | null = null;
      if (useAnon) {
        const matching = anonScores.filter(s => s.criterion_id === c.id);
        if (matching.length > 0) {
          const sum = matching.reduce((acc, curr) => acc + curr.score, 0);
          mean = sum / matching.length;
        }
      } else {
        const matchingScores = db.votes
          .filter(v => v.presentation_id === p.id && v.scores[c.id] !== undefined)
          .map(v => v.scores[c.id]);
        if (matchingScores.length > 0) {
          const sum = matchingScores.reduce((acc, curr) => acc + curr, 0);
          mean = sum / matchingScores.length;
        }
      }
      return {
        criterion_id: c.id,
        name: c.name,
        weight: c.weight,
        mean: mean !== null ? Math.round(mean * 100) / 100 : null
      };
    });

    let weightedScore: number | null = null;
    if (voteCount > 0) {
      let total = 0;
      const totalWeight = criteria.reduce((sum, c) => sum + (c.weight || 0), 0) || 100;
      for (const m of means) {
        if (m.mean !== null) {
          total += (m.mean * m.weight) / totalWeight;
        }
      }
      weightedScore = Math.round(total * 100) / 100;
    }

    return {
      presentation_id: p.id,
      presenter_name: p.presenter_name,
      title: p.title,
      status: p.status,
      vote_count: voteCount,
      criteria: means,
      weighted_score: weightedScore,
      rank: undefined as number | undefined
    };
  });

  const ranked = output
    .filter(x => (x.status === 'EVALUATED' || x.status === 'VOTING_OPEN') && x.weighted_score !== null)
    .sort((a, b) => (b.weighted_score || 0) - (a.weighted_score || 0));

  let previousScore: number | null = null;
  let rank = 0;
  for (let i = 0; i < ranked.length; i++) {
    if (previousScore === null || ranked[i].weighted_score !== previousScore) {
      rank = i + 1;
    }
    ranked[i].rank = rank;
    previousScore = ranked[i].weighted_score;
  }

  return output;
}

export function finalizeVotes(sessionId: number) {
  const presentations = db.presentations.filter(p => p.session_id === sessionId);
  for (const p of presentations) {
    const pVotes = db.votes.filter(v => v.presentation_id === p.id);
    for (const v of pVotes) {
      const anonId = crypto.randomBytes(16).toString('hex');
      for (const [cidStr, score] of Object.entries(v.scores)) {
        db.anonymousVoteScores.push({
          presentation_id: p.id,
          anonymous_vote_id: anonId,
          criterion_id: Number(cidStr),
          score: score
        });
      }
    }
    db.votes = db.votes.filter(v => v.presentation_id !== p.id);
  }
}
