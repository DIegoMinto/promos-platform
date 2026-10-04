import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';

import { Request } from 'express';
import { UserRole } from '@prisma/client';

import { BranchesService } from './branches.service.js';
import { CreateBranchDto } from './dto/create-branch.dto.js';
import { UpdateBranchDto } from './dto/update-branch.dto.js';

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

@Controller('api/branches')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BranchesController {
  constructor(
    private readonly branchesService: BranchesService,
  ) {}

  @Post()
  @Roles(UserRole.NEGOCIO)
  create(
    @Req() request: AuthenticatedRequest,
    @Body() createBranchDto: CreateBranchDto,
  ) {
    return this.branchesService.create(
      request.user.id,
      createBranchDto,
    );
  }

  @Get()
  @Roles(UserRole.NEGOCIO)
  findAll(
    @Req() request: AuthenticatedRequest,
  ) {
    return this.branchesService.findAll(
      request.user.id,
    );
  }

  @Get(':id')
  @Roles(UserRole.NEGOCIO)
  findOne(
    @Req() request: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.branchesService.findOne(
      request.user.id,
      id,
    );
  }

  @Patch(':id')
  @Roles(UserRole.NEGOCIO)
  update(
    @Req() request: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateBranchDto: UpdateBranchDto,
  ) {
    return this.branchesService.update(
      request.user.id,
      id,
      updateBranchDto,
    );
  }

  @Delete(':id')
  @Roles(UserRole.NEGOCIO)
  remove(
    @Req() request: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.branchesService.remove(
      request.user.id,
      id,
    );
  }

  @Patch(':id/restore')
  @Roles(UserRole.NEGOCIO)
  restore(
    @Req() request: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.branchesService.restore(
      request.user.id,
      id,
    );
  }
}