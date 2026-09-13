import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class HealthService {
  constructor(private readonly prisma: PrismaService) {}

  getStatus() {
    return {
      status: 'ok',
      message: 'Promos Platform API is running',
    };
  }

  async getDatabaseStatus() {
    await this.prisma.$queryRaw`SELECT 1`;

    return {
      status: 'ok',
      database: 'connected',
    };
  }
}