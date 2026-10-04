import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service.js';
import { UpdateProfileDto } from './dto/update-profile.dto.js';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async getProfile(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
        business: {
          select: {
            id: true,
            name: true,
            description: true,
            phone: true,
            logo: true,
            address: true,
            city: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException(
        'Usuario no encontrado',
      );
    }

    return user;
  }

  async updateProfile(
    userId: number,
    updateProfileDto: UpdateProfileDto,
  ) {
    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (!user) {
      throw new NotFoundException(
        'Usuario no encontrado',
      );
    }

    if (
      updateProfileDto.email &&
      updateProfileDto.email !== user.email
    ) {
      const existingUser =
        await this.prisma.user.findUnique({
          where: {
            email: updateProfileDto.email,
          },
        });

      if (existingUser) {
        throw new ConflictException(
          'El correo electrónico ya está registrado',
        );
      }
    }

    return this.prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        ...(updateProfileDto.name !== undefined && {
          name: updateProfileDto.name,
        }),
        ...(updateProfileDto.email !== undefined && {
          email: updateProfileDto.email,
        }),
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
      },
    });
  }
}