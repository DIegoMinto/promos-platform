import { Module } from '@nestjs/common';

import { PromotionsController } from './promotions.controller.js';
import { PromotionsService } from './promotions.service.js';

import { PrismaModule } from '../prisma/prisma.module.js';
import { CloudinaryModule } from '../cloudinary/cloudinary.module.js';
import { AuthModule } from '../auth/auth.module.js';

@Module({
  imports: [
    PrismaModule,
    CloudinaryModule,
    AuthModule,
  ],
  controllers: [PromotionsController],
  providers: [PromotionsService],
})
export class PromotionsModule {}