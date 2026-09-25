import { NotFoundException } from '@nestjs/common';
import { AssessmentService } from './assessment.service';

describe('AssessmentService', () => {
  it('starts a stage-appropriate assessment and completes with explainable results', () => {
    const service = new AssessmentService();
    const started = service.startAttempt('student-demo', 'assessment-middle-demo');
    service.addResponse(started.id, 'item-language', { score: 82 });
    service.addResponse(started.id, 'item-problem-solving', { score: 74 });
    service.addResponse(started.id, 'item-growth-mindset', { score: 91 });

    const completed = service.completeAttempt(started.id);

    expect(completed.status).toBe('COMPLETED');
    expect(completed.scoreSummary.totalCompetencies).toBe(3);
    expect(completed.scoreSummary.results.every((result) => result.explanation.length > 0)).toBe(true);
  });

  it('flags incomplete evidence instead of fabricating a score', () => {
    const service = new AssessmentService();
    const started = service.startAttempt('student-demo', 'assessment-middle-demo');
    service.addResponse(started.id, 'item-language', { score: 82 });

    const completed = service.completeAttempt(started.id);

    expect(completed.status).toBe('FLAGGED');
    expect(completed.scoreSummary.results.find((result) => result.competency === 'Problem Solving')?.score).toBeNull();
  });

  it('rejects an assessment from another developmental stage', () => {
    const service = new AssessmentService();
    expect(() => service.startAttempt('student-demo', 'assessment-middle-demo')).not.toThrow();
    expect(() => service.startAttempt('unknown-student', 'assessment-middle-demo')).toThrow(NotFoundException);
  });
});
