import { Body, Controller, Get, Param, Post, Put, Query, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { QuestionInput, QuestionsService } from './questions.service';
import { AdminAuthGuard } from './admin-auth.guard';
import { AccessTokenClaims } from './auth.types';

@Controller('api/v1/questions')
export class QuestionsController {
  constructor(private readonly service: QuestionsService) {}

  @Post()
  @UseGuards(AdminAuthGuard)
  create(@Req() request: Request & { user?: AccessTokenClaims }, @Body() body: QuestionInput) { return this.service.create(body, request.user?.sub); }

  @Get()
  list(@Query() filters: Record<string, string | undefined>) { return this.service.list(filters); }

  @Get(':questionId/versions')
  versions(@Param('questionId') questionId: string) { return this.service.getVersions(questionId); }

  @Get(':questionId')
  get(@Param('questionId') questionId: string) { return this.service.get(questionId); }

  @Put(':questionId')
  @UseGuards(AdminAuthGuard)
  update(@Req() request: Request & { user?: AccessTokenClaims }, @Param('questionId') questionId: string, @Body() body: Partial<QuestionInput> & { changeReason?: string }) { return this.service.update(questionId, { ...body, changedBy: request.user?.sub }); }

  @Put(':questionId/approve')
  @UseGuards(AdminAuthGuard)
  approve(@Param('questionId') questionId: string) { return this.service.setStatus(questionId, 'ACTIVE'); }

  @Put(':questionId/archive')
  @UseGuards(AdminAuthGuard)
  archive(@Param('questionId') questionId: string) { return this.service.setStatus(questionId, 'ARCHIVED'); }
}
