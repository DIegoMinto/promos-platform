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
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';

import { FileInterceptor } from '@nestjs/platform-express';

import { CloudinaryService } from '../cloudinary/cloudinary.service.js';

import { Request } from 'express';

import { UserRole } from '@prisma/client';

import { PromotionsService } from './promotions.service.js';

import { CreatePromotionDto } from './dto/create-promotion.dto.js';

import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';

import { RolesGuard } from '../auth/roles.guard.js';

import { Roles } from '../auth/roles.decorator.js';

import { UpdatePromotionDto } from './dto/update-promotion.dto.js';

interface AuthenticatedRequest extends Request {
  user: {
    id: number;
    name: string;
    email: string;
    role: UserRole;
  };
}

@Controller('api/promotions')
export class PromotionsController {
  constructor(
  private readonly promotionsService: PromotionsService,
  private readonly cloudinaryService: CloudinaryService,
) {}

  @Get()
  findPublicPromotions() {
    return this.promotionsService.findPublicPromotions();
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.NEGOCIO)
  create(
    @Req() request: AuthenticatedRequest,
    @Body() createPromotionDto: CreatePromotionDto,
  ) {
    return this.promotionsService.create(
      request.user.id,
      createPromotionDto,
    );
  }

  @Get('me')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.NEGOCIO)
  findMyPromotions(
    @Req() request: AuthenticatedRequest,
  ) {
    return this.promotionsService.findMyPromotions(
      request.user.id,
    );
  }

  @Get('summary')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.NEGOCIO)
  getSummary(
    @Req() request: AuthenticatedRequest,
  ) {
    return this.promotionsService.getSummary(
      request.user.id,
    );
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.NEGOCIO)
  update(
    @Req() request: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePromotionDto: UpdatePromotionDto,
  ) {
    return this.promotionsService.update(
      request.user.id,
      id,
      updatePromotionDto,
    );
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.NEGOCIO)
  remove(
    @Req() request: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.promotionsService.remove(
      request.user.id,
      id,
    );
  }

  @Get(':id')
findPublicPromotionById(
  @Param('id', ParseIntPipe) id: number,
) {
  return this.promotionsService.findPublicPromotionById(id);
}

@Post('upload-image')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.NEGOCIO)
@UseInterceptors(FileInterceptor('image'))
async uploadImage(
  @UploadedFile() file: Express.Multer.File,
) {
  if (!file) {
    return {
      message: 'No se recibió ninguna imagen',
    };
  }

  if (!file.mimetype.startsWith('image/')) {
    return {
      message: 'El archivo debe ser una imagen',
    };
  }

  const result = await this.cloudinaryService.uploadImage(file);

  return {
    message: 'Imagen subida correctamente',
    url: (result as any).secure_url,
  };
}

}