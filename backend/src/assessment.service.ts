import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import {
  Assessment,
  Attempt,
  CompetencyResult,
  Domain,
  Response,
  Stage,
  Student
} from './domain';

const stageWeights: Record<Stage, Record<Domain, number>> = {
  PREPARATORY: { ACADEMIC: 0.4, FUTURE_SKILLS: 0.35, LEARNING_DISPOSITION: 0.25 },
  MIDDLE: { ACADEMIC: 0.45, FUTURE_SKILLS: 0.3, LEARNING_DISPOSITION: 0.25 },
  SECONDARY: { ACADEMIC: 0.55, FUTURE_SKILLS: 0.25, LEARNING_DISPOSITION: 0.2 }
};

@Injectable()
export class AssessmentService {
  private readonly students: Student[] = [{
    id: 'student-demo', name: 'Aarav Sharma', schoolId: 'school-demo', classLevel: 7, stage: 'MIDDLE'
  }];
  private readonly assessments: Assessment[] = [{
    id: 'assessment-middle-demo', title: 'Stage 7 Holistic Growth Assessment', stage: 'MIDDLE',
    domainMix: ['ACADEMIC', 'FUTURE_SKILLS', 'LEARNING_DISPOSITION'], status: 'ACTIVE', items: [
      { id: 'item-language', competency: 'Language & Communication', domain: 'ACADEMIC', prompt: 'Explain an idea clearly in your own words.' },
      { id: 'item-problem-solving', competency: 'Problem Solving', domain: 'FUTURE_SKILLS', prompt: 'Describe how you would solve a new challenge.' },
      { id: 'item-growth-mindset', competency: 'Growth Mindset', domain: 'LEARNING_DISPOSITION', prompt: 'Reflect on a time practice helped you improve.' }
    ]
  }];
  private readonly attempts: Attempt[] = [];

  getStudent(studentId = 'student-demo'): Student {
    const student = this.students.find((candidate) => candidate.id === studentId);
    if (!student) throw new NotFoundException('Student not found');
    return student;
  }

  listAssessments(stage?: Stage) {
    return this.assessments
      .filter((assessment) => assessment.status === 'ACTIVE' && (!stage || assessment.stage === stage))
      .map(({ items, ...assessment }) => assessment);
  }

  startAttempt(studentId: string, assessmentId: string, sessionMetadata: Record<string, unknown> = {}) {
    const student = this.getStudent(studentId);
    const assessment = this.assessments.find((candidate) => candidate.id === assessmentId);
    if (!assessment) throw new NotFoundException('Assessment not found');
    if (assessment.stage !== student.stage) throw new BadRequestException('Assessment stage does not match student stage');
    const attempt: Attempt = {
      id: randomUUID(), studentId, assessmentId, startedAt: new Date().toISOString(), status: 'IN_PROGRESS', responses: []
    };
    this.attempts.push(attempt);
    return { id: attempt.id, status: attempt.status, startedAt: attempt.startedAt, sessionMetadata };
  }

  addResponse(attemptId: string, itemId: string, answer: Record<string, unknown>, isSkipped = false) {
    const attempt = this.getAttempt(attemptId);
    if (attempt.status !== 'IN_PROGRESS') throw new BadRequestException('Attempt is no longer accepting responses');
    const assessment = this.getAssessment(attempt.assessmentId);
    if (!assessment.items.some((item) => item.id === itemId)) throw new NotFoundException('Assessment item not found');
    const response: Response = { itemId, answer, isSkipped, submittedAt: new Date().toISOString() };
    const existingIndex = attempt.responses.findIndex((candidate) => candidate.itemId === itemId);
    if (existingIndex >= 0) attempt.responses[existingIndex] = response;
    else attempt.responses.push(response);
    return { id: itemId, attemptId, evaluationStatus: 'PENDING' };
  }

  completeAttempt(attemptId: string) {
    const attempt = this.getAttempt(attemptId);
    if (attempt.status !== 'IN_PROGRESS') throw new BadRequestException('Attempt is already complete');
    const assessment = this.getAssessment(attempt.assessmentId);
    const results = assessment.items.map((item) => this.scoreItem(item, attempt.responses.find((response) => response.itemId === item.id)));
    attempt.results = results;
    attempt.status = results.some((result) => result.evidenceStatus === 'INSUFFICIENT') ? 'FLAGGED' : 'COMPLETED';
    attempt.completedAt = new Date().toISOString();
    return {
      id: attempt.id, status: attempt.status, scoreSummary: {
        totalCompetencies: results.length,
        observedDomains: [...new Set(results.map((result) => result.domain))],
        results
      }
    };
  }

  getGrowth(studentId = 'student-demo') {
    this.getStudent(studentId);
    const completed = this.attempts.filter((attempt) => attempt.studentId === studentId && attempt.results && attempt.status === 'COMPLETED');
    const current = completed.at(-1);
    const prior = completed.at(-2);
    const currentResults = current?.results ?? [];
    const priorResults = prior?.results ?? [];
    const trend = completed.map((attempt) => ({ date: attempt.completedAt, scores: Object.fromEntries((attempt.results ?? []).filter((result) => result.score !== null).map((result) => [result.competency, result.score])) }));
    const improvedDomains = currentResults.filter((result) => {
      const previous = priorResults.find((candidate) => candidate.competency === result.competency);
      return result.score !== null && previous?.score !== null && previous !== undefined && result.score > previous.score;
    }).map((result) => result.competency);
    const supportNeeds = currentResults.filter((result) => result.score !== null && result.score < 60).map((result) => result.competency);
    return {
      studentId, currentAssessmentDate: current?.completedAt ?? null, compareAgainst: prior?.completedAt ?? null,
      summary: { improvedDomains, supportNeeds, strongestDomain: currentResults.filter((result) => result.score !== null).sort((a, b) => (b.score ?? 0) - (a.score ?? 0))[0]?.competency ?? null }, trend
    };
  }

  getRecommendations(studentId = 'student-demo') {
    const growth = this.getGrowth(studentId);
    return { recommendations: growth.summary.supportNeeds.map((competency) => ({ id: randomUUID(), competencyId: competency, type: 'PRACTICE', title: `${competency} practice`, summary: `Use short guided activities to strengthen ${competency.toLowerCase()} with confidence.`, priority: 'HIGH' })) };
  }

  private scoreItem(item: Assessment['items'][number], response?: Response): CompetencyResult {
    const scoreValue = response?.answer.score;
    const score = !response || response.isSkipped || typeof scoreValue !== 'number' ? null : Math.max(0, Math.min(100, scoreValue));
    return {
      competency: item.competency, domain: item.domain, score,
      evidenceStatus: score === null ? 'INSUFFICIENT' : 'SUFFICIENT',
      explanation: score === null ? 'There is not enough usable evidence for a reliable score.' : `The result is based on the submitted response evidence for ${item.competency}.`,
      recommendation: score === null || score < 60 ? `Practice ${item.competency.toLowerCase()} through short, guided activities.` : `Extend ${item.competency.toLowerCase()} with a more challenging activity.`
    };
  }

  private getAttempt(attemptId: string) {
    const attempt = this.attempts.find((candidate) => candidate.id === attemptId);
    if (!attempt) throw new NotFoundException('Assessment attempt not found');
    return attempt;
  }

  private getAssessment(assessmentId: string) {
    const assessment = this.assessments.find((candidate) => candidate.id === assessmentId);
    if (!assessment) throw new NotFoundException('Assessment not found');
    return assessment;
  }

  getStageWeights(stage: Stage) { return stageWeights[stage]; }
}
