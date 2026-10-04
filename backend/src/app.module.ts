import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module.js';
import { HealthModule } from './health/health.module.js';
import { UsersModule } from './users/users.module.js';
import { AuthModule } from './auth/auth.module.js';
import { BusinessesModule } from './businesses/businesses.module.js';
import { CategoriesModule } from './categories/categories.module.js';
import { PromotionsModule } from './promotions/promotions.module.js';
import { BranchesModule } from './branches/branches.module.js';
import { AdminModule } from './admin/admin.module.js';

@Module({
  imports: [
    PrismaModule,
    HealthModule,
    AuthModule,
    UsersModule,
    BusinessesModule,
    CategoriesModule,
    PromotionsModule,
    BranchesModule,
    AdminModule,
  ],
})
export class AppModule {}