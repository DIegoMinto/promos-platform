import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module.js';
import { HealthModule } from './health/health.module.js';
import { UsersModule } from './users/users.module.js';
import { AuthModule } from './auth/auth.module.js';

@Module({
  imports: [
    PrismaModule,
    HealthModule,
    UsersModule,
    AuthModule,
  ],
})
export class AppModule {}