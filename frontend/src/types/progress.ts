export type ProgressStatus = 'not_started' | 'in_progress' | 'completed';

export interface ProgressDetail {
  subtopic_id: number;
  status: ProgressStatus;
  xp_earned: number;
  assistance_level_used: number;
}

export interface Dashboard {
  total_subtopics: number;
  completed_subtopics: number;
  details: ProgressDetail[];
}
