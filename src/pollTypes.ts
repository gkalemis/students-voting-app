export interface PollOption {
  id: string; // e.g. "opt_0", "opt_1"
  text: string;
}

export type PollQuestionType = 'MULTIPLE_CHOICE' | 'TRUE_FALSE';

export interface PollQuestion {
  id: number;
  poll_id: number;
  text: string;
  type: PollQuestionType;
  options: string[]; // list of choices e.g. ["A", "B", "C"] or ["Σωστό", "Λάθος"]
  correct_option_index?: number | null; // index of correct option if quiz, null if opinion poll
  status: 'PENDING' | 'OPEN' | 'CLOSED' | 'SKIPPED';
  voting_opened_at?: string | null;
  voting_closes_at?: string | null;
  voting_closed_at?: string | null;
  position: number;
}

export interface PollSession {
  id: number;
  public_id: string;
  course_id: number;
  period_id: number;
  course_name?: string;
  period_name?: string;
  owner_id: number;
  session_date: string;
  title: string;
  status: 'DRAFT' | 'ACTIVE' | 'COMPLETED' | 'ARCHIVED';
  active_question_id?: number | null;
  show_results: boolean;
  is_demo?: boolean;
}

export interface PollAnswer {
  id: number;
  poll_id: number;
  question_id: number;
  token_id: string;
  selected_index: number;
}

export interface PollResultDistribution {
  option_index: number;
  option_text: string;
  count: number;
  percentage: number;
  is_correct?: boolean;
}

export interface PollQuestionResult {
  question_id: number;
  question_text: string;
  type: PollQuestionType;
  total_votes: number;
  correct_option_index?: number | null;
  distribution: PollResultDistribution[];
}
