import { Controller, Get } from '@nestjs/common';
import { HealthService } from './health.service.js';

@Controller('api/health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  getStatus() {
    return this.healthService.getStatus();
  }

  @Get('db')
  getDatabaseStatus() {
    return this.healthService.getDatabaseStatus();
}
}