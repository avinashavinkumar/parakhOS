import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { Assessment, Attempt, Response, Student } from './domain';
import { DatabaseService } from './database.service';

export interface AssessmentRepository {
  getStudent(studentId: string): Promise<Student | undefined>;
  listAssessments(): Promise<Assessment[]>;
  getAssessment(assessmentId: string): Promise<Assessment | undefined>;
  saveAttempt(attempt: Attempt): Promise<void>;
  getAttempt(attemptId: string): Promise<Attempt | undefined>;
  saveResponse(attemptId: string, response: Response): Promise<void>;
  saveResults(attemptId: string, results: Attempt['results']): Promise<void>;
  listCompletedAttempts(studentId: string): Promise<Attempt[]>;
}

@Injectable()
export class PostgresAssessmentRepository implements AssessmentRepository {
  constructor(private readonly database: DatabaseService) {}

  async getStudent(studentId: string) {
    const result = await this.database.query<Student>(
      `SELECT id::text, COALESCE(first_name || ' ' || last_name, first_name) AS name,
        COALESCE(school_name, 'school-demo') AS "schoolId", 7 AS "classLevel", 'MIDDLE' AS stage
       FROM students WHERE id::text = $1 OR ($1 = 'student-demo' AND first_name = 'Adweta')`, [studentId]);
    return result.rows[0];
  }

  async listAssessments() {
    const result = await this.database.query<Assessment & { items: Assessment['items'] }>(
      `SELECT id::text, name AS title, 'MIDDLE' AS stage, ARRAY['ACADEMIC','FUTURE_SKILLS','LEARNING_DISPOSITION'] AS "domainMix",
        CASE WHEN status = 'active' THEN 'ACTIVE' ELSE 'ARCHIVED' END AS status, '[]'::jsonb AS items
       FROM assessments ORDER BY created_at`);
    return result.rows;
  }

  async getAssessment(assessmentId: string) {
    const result = await this.database.query<Assessment>(
      `SELECT id::text, name AS title, 'MIDDLE' AS stage, ARRAY['ACADEMIC','FUTURE_SKILLS','LEARNING_DISPOSITION'] AS "domainMix",
        CASE WHEN status = 'active' THEN 'ACTIVE' ELSE 'ARCHIVED' END AS status, '[]'::jsonb AS items
       FROM assessments WHERE id::text = $1`, [assessmentId]);
    return result.rows[0];
  }

  async saveAttempt(attempt: Attempt) {
    await this.database.query(
      `INSERT INTO assessment_attempts (id, student_id, assessment_id, assessment_version, status, started_at)
       VALUES ($1, $2::uuid, $3::uuid, 1, $4, $5)`,
      [attempt.id, attempt.studentId, attempt.assessmentId, attempt.status, attempt.startedAt]);
  }

  async getAttempt(attemptId: string) {
    const result = await this.database.query<Attempt>(
      `SELECT id::text, student_id::text AS "studentId", assessment_id::text AS "assessmentId",
        started_at AS "startedAt", completed_at AS "completedAt", status,
        '[]'::jsonb AS responses, NULL::jsonb AS results
       FROM assessment_attempts WHERE id::text = $1`, [attemptId]);
    if (!result.rows[0]) return undefined;
    const responseResult = await this.database.query<Response>(
      `SELECT question_id::text AS "itemId", answer, false AS "isSkipped", created_at AS "submittedAt"
       FROM assessment_responses WHERE attempt_id::text = $1 ORDER BY created_at`, [attemptId]);
    result.rows[0].responses = responseResult.rows;
    return result.rows[0];
  }

  async saveResponse(attemptId: string, response: Response) {
    await this.database.query(
      `INSERT INTO assessment_responses (attempt_id, question_id, answer, created_at, updated_at)
       VALUES ($1::uuid, $2::uuid, $3, $4, $4)
       ON CONFLICT (attempt_id, question_id) DO UPDATE SET answer = EXCLUDED.answer, updated_at = EXCLUDED.updated_at`,
      [attemptId, response.itemId, response.answer, response.submittedAt]);
  }

  async saveResults(attemptId: string, results: Attempt['results']) {
    await this.database.query(
      `UPDATE assessment_attempts SET status = $2, completed_at = $3 WHERE id::text = $1`,
      [attemptId, results?.some((result) => result.evidenceStatus === 'INSUFFICIENT') ? 'flagged' : 'completed', new Date().toISOString()]);
  }

  async listCompletedAttempts(studentId: string) {
    const result = await this.database.query<Attempt>(
      `SELECT id::text, student_id::text AS "studentId", assessment_id::text AS "assessmentId",
        started_at AS "startedAt", completed_at AS "completedAt", status, '[]'::jsonb AS responses, NULL::jsonb AS results
       FROM assessment_attempts WHERE student_id::text = $1 AND status = 'completed' ORDER BY completed_at`, [studentId]);
    return result.rows;
  }
}

export class MemoryAssessmentRepository implements AssessmentRepository {
  private readonly students: Student[] = [{ id: 'student-demo', name: 'Adweta', schoolId: 'school-demo', classLevel: 7, stage: 'MIDDLE' }];
  private readonly assessments: Assessment[] = [{ id: 'assessment-middle-demo', title: 'Stage 7 Holistic Growth Assessment', stage: 'MIDDLE', domainMix: ['ACADEMIC', 'FUTURE_SKILLS', 'LEARNING_DISPOSITION'], status: 'ACTIVE', items: [
    { id: 'item-language', competency: 'Language & Communication', domain: 'ACADEMIC', prompt: 'Explain an idea clearly in your own words.' },
    { id: 'item-problem-solving', competency: 'Problem Solving', domain: 'FUTURE_SKILLS', prompt: 'Describe how you would solve a new challenge.' },
    { id: 'item-growth-mindset', competency: 'Growth Mindset', domain: 'LEARNING_DISPOSITION', prompt: 'Reflect on a time practice helped you improve.' }
  ] }];
  private readonly attempts: Attempt[] = [];

  async getStudent(studentId: string) { return this.students.find((student) => student.id === studentId); }
  async listAssessments() { return this.assessments; }
  async getAssessment(assessmentId: string) { return this.assessments.find((assessment) => assessment.id === assessmentId); }
  async saveAttempt(attempt: Attempt) { this.attempts.push(attempt); }
  async getAttempt(attemptId: string) { return this.attempts.find((attempt) => attempt.id === attemptId); }
  async saveResponse(attemptId: string, response: Response) {
    const attempt = this.attempts.find((candidate) => candidate.id === attemptId);
    if (!attempt) return;
    const index = attempt.responses.findIndex((candidate) => candidate.itemId === response.itemId);
    if (index >= 0) attempt.responses[index] = response; else attempt.responses.push(response);
  }
  async saveResults(attemptId: string, results: Attempt['results']) {
    const attempt = this.attempts.find((candidate) => candidate.id === attemptId);
    if (attempt) { attempt.results = results; attempt.status = results?.some((result) => result.evidenceStatus === 'INSUFFICIENT') ? 'FLAGGED' : 'COMPLETED'; attempt.completedAt = new Date().toISOString(); }
  }
  async listCompletedAttempts(studentId: string) { return this.attempts.filter((attempt) => attempt.studentId === studentId && attempt.status === 'COMPLETED'); }
}