import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service.js';

import { CreateBusinessDto } from './dto/create-business.dto.js';
import { UpdateBusinessDto } from './dto/update-business.dto.js';

@Injectable()
export class BusinessesService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async create(
    userId: number,
    createBusinessDto: CreateBusinessDto,
  ) {
    const existingBusiness =
      await this.prisma.business.findUnique({
        where: {
          userId,
        },
      });

    if (existingBusiness) {
      throw new ConflictException(
        'El usuario ya tiene un negocio registrado',
      );
    }

    return this.prisma.business.create({
      data: {
        userId,
        name: createBusinessDto.name,
        description:
          createBusinessDto.description,
        phone: createBusinessDto.phone,
        logo: createBusinessDto.logo,
        address: createBusinessDto.address,
        city: createBusinessDto.city,
        latitude: createBusinessDto.latitude,
        longitude: createBusinessDto.longitude,
      },
    });
  }

  async findMyBusiness(userId: number) {
    const business =
      await this.prisma.business.findUnique({
        where: {
          userId,
        },
      });

    if (!business) {
      throw new NotFoundException(
        'El usuario no tiene un negocio registrado',
      );
    }

    return business;
  }

  async updateMyBusiness(
    userId: number,
    updateBusinessDto: UpdateBusinessDto,
  ) {
    const business =
      await this.prisma.business.findUnique({
        where: {
          userId,
        },
      });

    if (!business) {
      throw new NotFoundException(
        'El usuario no tiene un negocio registrado',
      );
    }

    return this.prisma.business.update({
      where: {
        id: business.id,
      },
      data: {
        ...(updateBusinessDto.name !== undefined && {
          name: updateBusinessDto.name,
        }),

        ...(updateBusinessDto.description !==
          undefined && {
          description:
            updateBusinessDto.description,
        }),

        ...(updateBusinessDto.phone !== undefined && {
          phone: updateBusinessDto.phone,
        }),

        ...(updateBusinessDto.logo !== undefined && {
          logo: updateBusinessDto.logo,
        }),

        ...(updateBusinessDto.address !== undefined && {
          address: updateBusinessDto.address,
        }),

        ...(updateBusinessDto.city !== undefined && {
          city: updateBusinessDto.city,
        }),

        ...(updateBusinessDto.latitude !== undefined && {
          latitude: updateBusinessDto.latitude,
        }),

        ...(updateBusinessDto.longitude !== undefined && {
          longitude: updateBusinessDto.longitude,
        }),
      },
    });
  }
}