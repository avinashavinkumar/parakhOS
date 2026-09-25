import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { AssessmentService } from './assessment.service';
import { Stage } from './domain';

@Controller('api/v1')
export class AssessmentController {
  constructor(private readonly service: AssessmentService) {}

  @Get('students/me')
  getStudent() { return this.service.getStudent(); }

  @Get('assessments')
  listAssessments(@Query('stage') stage?: Stage) { return { items: this.service.listAssessments(stage) }; }

  @Post('assessment-attempts')
  startAttempt(@Body() body: { studentId?: string; assessmentId: string; sessionMetadata?: Record<string, unknown> }) {
    return this.service.startAttempt(body.studentId ?? 'student-demo', body.assessmentId, body.sessionMetadata);
  }

  @Post('assessment-attempts/:attemptId/responses')
  addResponse(@Param('attemptId') attemptId: string, @Body() body: { itemId: string; answer: Record<string, unknown>; isSkipped?: boolean }) {
    return this.service.addResponse(attemptId, body.itemId, body.answer, body.isSkipped);
  }

  @Post('assessment-attempts/:attemptId/complete')
  completeAttempt(@Param('attemptId') attemptId: string) { return this.service.completeAttempt(attemptId); }

  @Get('students/me/growth')
  getGrowth() { return this.service.getGrowth(); }

  @Get('students/me/recommendations')
  getRecommendations() { return this.service.getRecommendations(); }
}
