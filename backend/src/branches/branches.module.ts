import { Module } from '@nestjs/common';

import { PrismaModule } from '../prisma/prisma.module.js';
import { AuthModule } from '../auth/auth.module.js';

import { BranchesController } from './branches.controller.js';
import { BranchesService } from './branches.service.js';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
  ],
  controllers: [BranchesController],
  providers: [BranchesService],
})
export class BranchesModule {}