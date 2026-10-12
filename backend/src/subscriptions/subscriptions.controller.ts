
import {
  Body,
  Controller,
  Get,
  ParseIntPipe,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';

import { Request } from 'express';
import { UserRole } from '@prisma/client';

import { SubscriptionsService } from './subscriptions.service.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { Roles } from '../auth/roles.decorator.js';

interface AuthenticatedRequest extends Request {
  user: {
    id: number;
    name: string;
    email: string;
    role: UserRole;
  };
}

@Controller('api/subscriptions')
export class SubscriptionsController {
  constructor(
    private readonly subscriptionsService: SubscriptionsService,
  ) {}

  @Get('plans')
  findActivePlans() {
    return this.subscriptionsService.findActivePlans();
  }

  @Get('me')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.NEGOCIO)
  findMySubscription(
    @Req() request: AuthenticatedRequest,
  ) {
    return this.subscriptionsService.findMySubscription(
      request.user.id,
    );
  }

  @Post('request')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.NEGOCIO)
  requestSubscription(
    @Req() request: AuthenticatedRequest,
    @Body('planId', ParseIntPipe) planId: number,
  ) {
    return this.subscriptionsService.requestSubscription(
      request.user.id,
      planId,
    );
  }
}
