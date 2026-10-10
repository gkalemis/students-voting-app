export interface Brand {
  university_name?: string;
  school_name?: string;
  department_name?: string;
  logo_url?: string;
  background_type?: string;
  background_value?: string;
  background_image_url?: string;
  background_opacity: number;
}

export interface Result {
  presenter_name: string;
  vote_count: number;
  weighted_score?: number;
  rank?: number;
}

export interface State {
  public_id: string;
  title?: string;
  course: string;
  period: string;
  group: string;
  session_date: string;
  status: string;
  active_presentation?: {
    id: number;
    presenter_name: string;
    title?: string;
    closes_at?: string;
  };
  criteria: {
    id: number;
    name: string;
    weight: number;
  }[];
  vote_count: number;
  participation_url: string;
  results_revealed: boolean;
  presentations?: any[];
  results?: Result[];
  branding: Brand;
}

export interface User {
  id: number;
  username: string;
  full_name: string;
  role: 'ADMIN' | 'LECTURER';
  active: boolean;
  must_change_password: boolean;
  theme_color?: string;
}

export interface CriterionItem {
  id?: number;
  name: string;
  weight: number;
  position?: number;
}

export interface PresentationItem {
  id: number;
  presenter_name: string;
  title?: string | null;
  status: string;
  vote_count: number;
  criteria?: CriterionItem[];
}

export type FormKind = 'course' | 'period' | 'group' | 'session' | null;
