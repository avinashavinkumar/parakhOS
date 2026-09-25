import { Module } from '@nestjs/common';
import { DatabaseService } from './database.service';
import { QuestionsController } from './questions.controller';
import { QuestionsService } from './questions.service';
import { AuthModule } from './auth.module';
import { AdminAuthGuard } from './admin-auth.guard';

@Module({
  imports: [AuthModule],
  controllers: [QuestionsController],
  providers: [QuestionsService, DatabaseService, AdminAuthGuard],
  exports: [QuestionsService]
})
export class QuestionsModule {}
