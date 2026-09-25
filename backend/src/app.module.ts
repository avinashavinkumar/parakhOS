import { Module } from '@nestjs/common';
import { AssessmentController } from './assessment.controller';
import { AssessmentService } from './assessment.service';
import { HealthController } from './health.controller';
import { DatabaseService } from './database.service';
import { AuthModule } from './auth.module';
import { QuestionsModule } from './questions.module';
import { CurriculumModule } from './curriculum.module';

@Module({ imports: [AuthModule, QuestionsModule, CurriculumModule], controllers: [AssessmentController, HealthController], providers: [AssessmentService, DatabaseService] })
export class AppModule {}
