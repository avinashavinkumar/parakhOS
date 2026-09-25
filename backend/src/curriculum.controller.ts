import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { CurriculumService } from './curriculum.service';
import { AdminAuthGuard } from './admin-auth.guard';

type CurriculumImportRow = {
  classGrade: string;
  stage: string;
  subject: string;
  subjectCode: string;
  topic: string;
  description?: string;
  learningObjectives?: string;
  month?: string;
  bloomLevels?: string;
};

@Controller('api/v1/curriculum')
export class CurriculumController {
  constructor(private readonly service: CurriculumService) {}

  @Get('boards')
  getBoards() { return this.service.getBoards(); }

  @Post('import')
  @UseGuards(AdminAuthGuard)
  importRows(@Body() body: { rows?: CurriculumImportRow[] }) {
		return this.service.importRows(body.rows ?? []);
	}

  @Get('boards/:boardId/classes')
  getClasses(@Param('boardId') boardId: string) { return this.service.getClasses(boardId); }

  @Get('classes/:classId/subjects')
  getSubjects(@Param('classId') classId: string) { return this.service.getSubjects(classId); }

  @Get('subjects/:subjectId/topics')
  getTopics(@Param('subjectId') subjectId: string) { return this.service.getTopics(subjectId); }

  @Get('topics/:topicId/subtopics')
  getSubtopics(@Param('topicId') topicId: string) { return this.service.getSubtopics(topicId); }

  @Get('topics/:topicId/learning-objectives')
  getLearningObjectives(@Param('topicId') topicId: string) { return this.service.getLearningObjectives(topicId); }
}
