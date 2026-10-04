import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';

import { Request } from 'express';

import { UserRole } from '@prisma/client';

import { BusinessesService } from './businesses.service.js';

import { CreateBusinessDto } from './dto/create-business.dto.js';
import { UpdateBusinessDto } from './dto/update-business.dto.js';

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

@Controller('api/businesses')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BusinessesController {
  constructor(
    private readonly businessesService: BusinessesService,
  ) {}

  @Post()
  @Roles(UserRole.NEGOCIO)
  create(
    @Req() request: AuthenticatedRequest,
    @Body() createBusinessDto: CreateBusinessDto,
  ) {
    return this.businessesService.create(
      request.user.id,
      createBusinessDto,
    );
  }

  @Get('me')
  @Roles(UserRole.NEGOCIO)
  findMyBusiness(
    @Req() request: AuthenticatedRequest,
  ) {
    return this.businessesService.findMyBusiness(
      request.user.id,
    );
  }

  @Patch('me')
  @Roles(UserRole.NEGOCIO)
  updateMyBusiness(
    @Req() request: AuthenticatedRequest,
    @Body() updateBusinessDto: UpdateBusinessDto,
  ) {
    return this.businessesService.updateMyBusiness(
      request.user.id,
      updateBusinessDto,
    );
  }
}