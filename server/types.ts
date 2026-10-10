export interface User {
  id: number;
  username: string;
  full_name: string;
  password_hash: string;
  role: 'ADMIN' | 'LECTURER';
  active: boolean;
  must_change_password: boolean;
  auth_version: number;
  theme_color: string;
}

export interface Branding {
  university_name?: string;
  school_name?: string;
  department_name?: string;
  logo_url?: string | null;
  background_type?: string;
  background_value?: string;
  background_image_url?: string | null;
  background_opacity: number;
}

export interface AcademicPeriod {
  id: number;
  name: string;
  owner_id: number;
}

export interface Course {
  id: number;
  name: string;
  description?: string | null;
  owner_id: number;
  period_id: number;
  branding?: Partial<Branding>;
}

export interface StudentGroup {
  id: number;
  title: string;
  course_id: number;
  period_id: number;
  owner_id: number;
  presentation_date?: string | null;
}

export interface Student {
  id: number;
  group_id: number;
  full_name: string;
  presentation_title?: string | null;
}

export interface Criterion {
  id: number;
  session_id: number;
  name: string;
  weight: number;
  position: number;
}

export interface Presentation {
  id: number;
  session_id: number;
  student_id?: number | null;
  presenter_name: string;
  title?: string | null;
  position: number;
  status: 'PENDING' | 'VOTING_OPEN' | 'EVALUATED' | 'NO_VOTES' | 'SKIPPED';
  voting_opened_at?: string | null;
  voting_closes_at?: string | null;
  voting_closed_at?: string | null;
  criteria?: Criterion[];
}

export interface PresentationSession {
  id: number;
  public_id: string;
  course_id: number;
  period_id: number;
  group_id: number;
  owner_id: number;
  session_date: string;
  title?: string | null;
  status: 'DRAFT' | 'ACTIVE' | 'COMPLETED' | 'ARCHIVED';
  lock_new_participants: boolean;
  criteria_locked: boolean;
  voting_duration: number;
  is_demo: boolean;
  results_revealed: boolean;
  completed_at?: string | null;
}

export interface ParticipationToken {
  id: number;
  session_id: number;
  token: string;
  token_hash: string;
  issued_at: string;
  expires_at: string;
  revoked: boolean;
}

export interface Vote {
  id: number;
  presentation_id: number;
  token_id: number;
  scores: Record<number, number>;
}

export interface AnonymousVoteScore {
  presentation_id: number;
  anonymous_vote_id: string;
  criterion_id: number;
  score: number;
  synthetic?: boolean;
}
