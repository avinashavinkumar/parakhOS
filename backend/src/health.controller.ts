import { Controller, Get } from '@nestjs/common';
import { DatabaseService } from './database.service';

@Controller('health')
export class HealthController {
  constructor(private readonly database: DatabaseService) {}

  @Get()
  async getHealth() {
    const database = await this.database.isHealthy();
    return { status: database.connected || !database.enabled ? 'ok' : 'degraded', service: 'student-os-api', database };
  }
}
