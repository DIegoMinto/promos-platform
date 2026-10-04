import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service.js';

import { CreateBranchDto } from './dto/create-branch.dto.js';
import { UpdateBranchDto } from './dto/update-branch.dto.js';

@Injectable()
export class BranchesService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async create(
    userId: number,
    createBranchDto: CreateBranchDto,
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

    const existingBranch =
      await this.prisma.branch.findFirst({
        where: {
          businessId: business.id,
          name: createBranchDto.name,
        },
      });

    if (existingBranch) {
      throw new ConflictException(
        'Ya existe una sucursal con ese nombre',
      );
    }

    return this.prisma.branch.create({
      data: {
        businessId: business.id,
        name: createBranchDto.name,
        address: createBranchDto.address,
        city: createBranchDto.city,
        phone: createBranchDto.phone,
        latitude: createBranchDto.latitude,
        longitude: createBranchDto.longitude,
      },
    });
  }

  async findAll(userId: number) {
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

    return this.prisma.branch.findMany({
      where: {
        businessId: business.id,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(
    userId: number,
    branchId: number,
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

    const branch =
      await this.prisma.branch.findFirst({
        where: {
          id: branchId,
          businessId: business.id,
        },
      });

    if (!branch) {
      throw new NotFoundException(
        'La sucursal no existe o no pertenece a tu negocio',
      );
    }

    return branch;
  }

  async update(
    userId: number,
    branchId: number,
    updateBranchDto: UpdateBranchDto,
  ) {
    const branch = await this.findOne(
      userId,
      branchId,
    );

    if (
      updateBranchDto.name !== undefined &&
      updateBranchDto.name !== branch.name
    ) {
      const existingBranch =
        await this.prisma.branch.findFirst({
          where: {
            businessId: branch.businessId,
            name: updateBranchDto.name,
            NOT: {
              id: branchId,
            },
          },
        });

      if (existingBranch) {
        throw new ConflictException(
          'Ya existe una sucursal con ese nombre',
        );
      }
    }

    return this.prisma.branch.update({
      where: {
        id: branchId,
      },
      data: {
        ...(updateBranchDto.name !== undefined && {
          name: updateBranchDto.name,
        }),

        ...(updateBranchDto.address !== undefined && {
          address: updateBranchDto.address,
        }),

        ...(updateBranchDto.city !== undefined && {
          city: updateBranchDto.city,
        }),

        ...(updateBranchDto.phone !== undefined && {
          phone: updateBranchDto.phone,
        }),

        ...(updateBranchDto.latitude !== undefined && {
          latitude: updateBranchDto.latitude,
        }),

        ...(updateBranchDto.longitude !== undefined && {
          longitude: updateBranchDto.longitude,
        }),

        ...(updateBranchDto.status !== undefined && {
          status: updateBranchDto.status,
        }),
      },
    });
  }

  async remove(
    userId: number,
    branchId: number,
  ) {
    await this.findOne(userId, branchId);

    return this.prisma.branch.update({
      where: {
        id: branchId,
      },
      data: {
        status: false,
      },
    });
  }

  async restore(
    userId: number,
    branchId: number,
  ) {
    await this.findOne(userId, branchId);

    return this.prisma.branch.update({
      where: {
        id: branchId,
      },
      data: {
        status: true,
      },
    });
  }
}