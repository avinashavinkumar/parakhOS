import { Module } from '@nestjs/common';
import { CurriculumController } from './curriculum.controller';
import { CurriculumService } from './curriculum.service';
import { DatabaseService } from './database.service';
import { AuthModule } from './auth.module';
import { AdminAuthGuard } from './admin-auth.guard';

@Module({
  imports: [AuthModule],
  controllers: [CurriculumController],
  providers: [CurriculumService, DatabaseService, AdminAuthGuard],
  exports: [CurriculumService]
})
export class CurriculumModule {}
