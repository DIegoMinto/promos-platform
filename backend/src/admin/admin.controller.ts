import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';

import { AdminService } from './admin.service.js';

import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { Roles } from '../auth/roles.decorator.js';

import { UserRole } from '@prisma/client';

@Controller('api/admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
  ) {}

  @Get('dashboard')
  getDashboardStats() {
    return this.adminService.getDashboardStats();
  }

  @Get('users')
  getUsers() {
    return this.adminService.getUsers();
  }

  @Patch('users/:id/status')
  updateUserStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body('status') status: boolean,
    @Req() request: any,
  ) {
    return this.adminService.updateUserStatus(
      id,
      status,
      request.user.id,
    );
  }

  @Get('businesses')
  getBusinesses() {
    return this.adminService.getBusinesses();
  }

  @Patch('businesses/:id/status')
  updateBusinessStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body('status') status: boolean,
  ) {
    return this.adminService.updateBusinessStatus(
      id,
      status,
    );
  }

  @Get('promotions')
  getPromotions() {
    return this.adminService.getPromotions();
  }

  @Patch('promotions/:id/status')
  updatePromotionStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body('status') status: boolean,
  ) {
    return this.adminService.updatePromotionStatus(
      id,
      status,
    );
  }

  // =========================
  // CATEGORÍAS
  // =========================

  @Get('categories')
  getCategories() {
    return this.adminService.getCategories();
  }

  @Post('categories')
  createCategory(
    @Body()
    body: {
      name: string;
      description?: string;
      icon?: string;
    },
  ) {
    return this.adminService.createCategory(body);
  }

  @Patch('categories/:id')
  updateCategory(
    @Param('id', ParseIntPipe) id: number,
    @Body()
    body: {
      name?: string;
      description?: string;
      icon?: string;
    },
  ) {
    return this.adminService.updateCategory(
      id,
      body,
    );
  }

  @Patch('categories/:id/status')
  updateCategoryStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body('status') status: boolean,
  ) {
    return this.adminService.updateCategoryStatus(
      id,
      status,
    );
  }
}