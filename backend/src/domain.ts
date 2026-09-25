export type Stage = 'PREPARATORY' | 'MIDDLE' | 'SECONDARY';
export type Domain = 'ACADEMIC' | 'FUTURE_SKILLS' | 'LEARNING_DISPOSITION';
export type AttemptStatus = 'IN_PROGRESS' | 'COMPLETED' | 'FLAGGED';

export interface Student {
  id: string;
  name: string;
  schoolId: string;
  classLevel: number;
  stage: Stage;
}

export interface AssessmentItem {
  id: string;
  competency: string;
  domain: Domain;
  prompt: string;
}

export interface Assessment {
  id: string;
  title: string;
  stage: Stage;
  domainMix: Domain[];
  status: 'ACTIVE' | 'ARCHIVED';
  items: AssessmentItem[];
}

export interface Response {
  itemId: string;
  answer: Record<string, unknown>;
  isSkipped: boolean;
  submittedAt: string;
}

export interface CompetencyResult {
  competency: string;
  domain: Domain;
  score: number | null;
  evidenceStatus: 'SUFFICIENT' | 'INSUFFICIENT';
  explanation: string;
  recommendation: string;
}

export interface Attempt {
  id: string;
  studentId: string;
  assessmentId: string;
  startedAt: string;
  completedAt?: string;
  status: AttemptStatus;
  responses: Response[];
  results?: CompetencyResult[];
}
