import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service.js';
import { CreatePromotionDto } from './dto/create-promotion.dto.js';
import { UpdatePromotionDto } from './dto/update-promotion.dto.js';

@Injectable()
export class PromotionsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    userId: number,
    createPromotionDto: CreatePromotionDto,
  ) {
    const business = await this.prisma.business.findUnique({
      where: { userId },
    });

    if (!business) {
      throw new NotFoundException(
        'El usuario no tiene un negocio registrado',
      );
    }

    const category = await this.prisma.category.findUnique({
      where: { id: createPromotionDto.categoryId },
    });

    if (!category || !category.status) {
      throw new NotFoundException(
        'La categoría no existe o está inactiva',
      );
    }

    if (
      createPromotionDto.discountPrice >
      createPromotionDto.originalPrice
    ) {
      throw new BadRequestException(
        'El precio promocional no puede ser mayor al precio original',
      );
    }

    const startDate = new Date(createPromotionDto.startDate);
    const endDate = new Date(createPromotionDto.endDate);

    if (startDate >= endDate) {
      throw new BadRequestException(
        'La fecha de inicio debe ser anterior a la fecha de finalización',
      );
    }

    if (
      !createPromotionDto.branchIds ||
      createPromotionDto.branchIds.length === 0
    ) {
      throw new BadRequestException(
        'Debes seleccionar al menos una sucursal',
      );
    }

    const branchIds = [...new Set(createPromotionDto.branchIds)];

    const branches = await this.prisma.branch.findMany({
      where: {
        id: { in: branchIds },
        businessId: business.id,
        status: true,
      },
      select: { id: true },
    });

    if (branches.length !== branchIds.length) {
      throw new BadRequestException(
        'Una o más sucursales no existen, están inactivas o no pertenecen a tu negocio',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const now = new Date();

      const subscription = await tx.subscription.findFirst({
        where: {
          businessId: business.id,
          status: 'ACTIVE',
          startDate: { lte: now },
          endDate: { gt: now },
        },
        include: { plan: true },
        orderBy: { endDate: 'desc' },
      });

      let promotionLimit: number | null;

      if (subscription) {
        promotionLimit = subscription.plan.promotionLimit;
      } else {
        const freePlan = await tx.plan.findUnique({
          where: { code: 'FREE' },
        });

        if (!freePlan || !freePlan.status) {
          throw new NotFoundException(
            'El plan Gratis no está configurado o está inactivo',
          );
        }

        promotionLimit = freePlan.promotionLimit;
      }

      const currentPromotions = await tx.promotion.count({
        where: {
          businessId: business.id,
          status: true,
          endDate: { gt: now },
        },
      });

      if (
        promotionLimit !== null &&
        currentPromotions >= promotionLimit
      ) {
        throw new ConflictException(
          `Has alcanzado el límite de ${promotionLimit} promociones de tu plan. Desactiva o espera a que venza una promoción, o cambia de plan para publicar más.`,
        );
      }

      const promotion = await tx.promotion.create({
        data: {
          businessId: business.id,
          categoryId: createPromotionDto.categoryId,
          title: createPromotionDto.title,
          description: createPromotionDto.description,
          image: createPromotionDto.image,
          originalPrice: createPromotionDto.originalPrice,
          discountPrice: createPromotionDto.discountPrice,
          startDate,
          endDate,
        },
      });

      await tx.promotionBranch.createMany({
        data: branchIds.map((branchId) => ({
          promotionId: promotion.id,
          branchId,
        })),
      });

      return tx.promotion.findUnique({
        where: { id: promotion.id },
        include: {
          category: true,
          branches: {
            include: { branch: true },
          },
        },
      });
    });
  }

  async findMyPromotions(userId: number) {
    const business = await this.prisma.business.findUnique({
      where: { userId },
    });

    if (!business) {
      throw new NotFoundException(
        'El usuario no tiene un negocio registrado',
      );
    }

    return this.prisma.promotion.findMany({
      where: { businessId: business.id },
      include: {
        category: true,
        branches: {
          include: { branch: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findPublicPromotions() {
    const now = new Date();

    return this.prisma.promotion.findMany({
      where: {
        status: true,
        startDate: { lte: now },
        endDate: { gte: now },
      },
      include: {
        category: true,
        business: {
          select: {
            id: true,
            name: true,
            description: true,
            phone: true,
            logo: true,
            address: true,
            city: true,
            deliveryEnabled: true,
            deliveryFee: true,
          },
        },
        branches: {
          where: {
            branch: {
              status: true,
              latitude: { not: null },
              longitude: { not: null },
            },
          },
          include: {
            branch: {
              select: {
                id: true,
                name: true,
                address: true,
                city: true,
                latitude: true,
                longitude: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getSummary(userId: number) {
    const business = await this.prisma.business.findUnique({
      where: { userId },
    });

    if (!business) {
      throw new NotFoundException(
        'El usuario no tiene un negocio registrado',
      );
    }

    const now = new Date();

    const total = await this.prisma.promotion.count({
      where: { businessId: business.id },
    });

    const active = await this.prisma.promotion.count({
      where: {
        businessId: business.id,
        status: true,
        startDate: { lte: now },
        endDate: { gte: now },
      },
    });

    const expiringSoon = await this.prisma.promotion.count({
      where: {
        businessId: business.id,
        status: true,
        endDate: {
          gte: now,
          lte: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
        },
      },
    });

    const categories = await this.prisma.promotion.groupBy({
      by: ['categoryId'],
      where: { businessId: business.id },
    });

    return {
      total,
      active,
      expiringSoon,
      categories: categories.length,
    };
  }

  async update(
    userId: number,
    promotionId: number,
    updatePromotionDto: UpdatePromotionDto,
  ) {
    const business = await this.prisma.business.findUnique({
      where: { userId },
    });

    if (!business) {
      throw new NotFoundException(
        'El usuario no tiene un negocio registrado',
      );
    }

    const promotion = await this.prisma.promotion.findFirst({
      where: {
        id: promotionId,
        businessId: business.id,
      },
    });

    if (!promotion) {
      throw new NotFoundException(
        'La promoción no existe o no pertenece a tu negocio',
      );
    }

    const originalPrice =
      updatePromotionDto.originalPrice ?? Number(promotion.originalPrice);

    const discountPrice =
      updatePromotionDto.discountPrice ?? Number(promotion.discountPrice);

    if (discountPrice > originalPrice) {
      throw new BadRequestException(
        'El precio promocional no puede ser mayor al precio original',
      );
    }

    const startDate = updatePromotionDto.startDate
      ? new Date(updatePromotionDto.startDate)
      : promotion.startDate;

    const endDate = updatePromotionDto.endDate
      ? new Date(updatePromotionDto.endDate)
      : promotion.endDate;

    if (startDate >= endDate) {
      throw new BadRequestException(
        'La fecha de inicio debe ser anterior a la fecha de finalización',
      );
    }

    if (updatePromotionDto.categoryId !== undefined) {
      const category = await this.prisma.category.findUnique({
        where: { id: updatePromotionDto.categoryId },
      });

      if (!category || !category.status) {
        throw new NotFoundException(
          'La categoría no existe o está inactiva',
        );
      }
    }

    let branchIds: number[] | undefined;

    if (updatePromotionDto.branchIds !== undefined) {
      if (updatePromotionDto.branchIds.length === 0) {
        throw new BadRequestException(
          'Debes seleccionar al menos una sucursal',
        );
      }

      branchIds = [...new Set(updatePromotionDto.branchIds)];

      const branches = await this.prisma.branch.findMany({
        where: {
          id: { in: branchIds },
          businessId: business.id,
          status: true,
        },
        select: { id: true },
      });

      if (branches.length !== branchIds.length) {
        throw new BadRequestException(
          'Una o más sucursales no existen, están inactivas o no pertenecen a tu negocio',
        );
      }
    }

    return this.prisma.$transaction(async (tx) => {
      const updatedPromotion = await tx.promotion.update({
        where: { id: promotion.id },
        data: {
          ...(updatePromotionDto.title !== undefined && {
            title: updatePromotionDto.title,
          }),
          ...(updatePromotionDto.description !== undefined && {
            description: updatePromotionDto.description,
          }),
          ...(updatePromotionDto.image !== undefined && {
            image: updatePromotionDto.image,
          }),
          ...(updatePromotionDto.originalPrice !== undefined && {
            originalPrice: updatePromotionDto.originalPrice,
          }),
          ...(updatePromotionDto.discountPrice !== undefined && {
            discountPrice: updatePromotionDto.discountPrice,
          }),
          ...(updatePromotionDto.startDate !== undefined && {
            startDate,
          }),
          ...(updatePromotionDto.endDate !== undefined && {
            endDate,
          }),
          ...(updatePromotionDto.categoryId !== undefined && {
            categoryId: updatePromotionDto.categoryId,
          }),
        },
      });

      if (branchIds !== undefined) {
        await tx.promotionBranch.deleteMany({
          where: { promotionId: promotion.id },
        });

        await tx.promotionBranch.createMany({
          data: branchIds.map((branchId) => ({
            promotionId: promotion.id,
            branchId,
          })),
        });
      }

      return tx.promotion.findUnique({
        where: { id: updatedPromotion.id },
        include: {
          category: true,
          branches: {
            include: { branch: true },
          },
        },
      });
    });
  }

  

async remove(userId: number, promotionId: number) {
  const business = await this.prisma.business.findUnique({
    where: { userId },
  });

  if (!business) {
    throw new NotFoundException(
      'El usuario no tiene un negocio registrado',
    );
  }

  const promotion = await this.prisma.promotion.findFirst({
    where: {
      id: promotionId,
      businessId: business.id,
    },
    include: {
      _count: {
        select: {
          redemptions: true,
          orderItems: true,
        },
      },
    },
  });

  if (!promotion) {
    throw new NotFoundException(
      'La promoción no existe o no pertenece a tu negocio',
    );
  }

  // Si tiene historial, se desactiva para conservarlo.
  if (
    promotion._count.redemptions > 0 ||
    promotion._count.orderItems > 0
  ) {
    await this.prisma.promotion.update({
      where: { id: promotion.id },
      data: { status: false },
    });

    return {
      message:
        'La promoción tiene historial de pedidos o canjes. Se desactivó para conservar esos registros.',
      deleted: false,
      deactivated: true,
    };
  }

  // Si no tiene historial, puede eliminarse.
  await this.prisma.promotion.delete({
    where: { id: promotion.id },
  });

  return {
    message: 'Promoción eliminada correctamente',
    deleted: true,
    deactivated: false,
  };
}



  async findPublicPromotionById(id: number) {
    const now = new Date();

    const promotion = await this.prisma.promotion.findFirst({
      where: {
        id,
        status: true,
        startDate: { lte: now },
        endDate: { gte: now },
      },
      include: {
        category: true,
        business: {
          select: {
            id: true,
            name: true,
            description: true,
            phone: true,
            logo: true,
            address: true,
            city: true,
            deliveryEnabled: true,
            deliveryFee: true,
          },
        },
branches: {
  where: {
    branch: {
      status: true,
    },
  },
  include: {
    branch: {
      select: {
        id: true,
        name: true,
        address: true,
        city: true,
        phone: true,
        status: true,
            latitude: true,
    longitude: true,
      },
    },
  },
},
      },
    });

    if (!promotion) {
      throw new NotFoundException(
        'La promoción no existe o ya no está disponible',
      );
    }

    return promotion;
  }

  async findFeaturedPromotions() {
    const now = new Date();

    const promotions = await this.prisma.promotion.findMany({
      where: {
        status: true,
        startDate: { lte: now },
        endDate: { gte: now },
        business: {
          subscriptions: {
            some: {
              status: 'ACTIVE',
              startDate: { lte: now },
              endDate: { gt: now },
              plan: {
                code: 'FEATURED',
                status: true,
              },
            },
          },
        },
      },
      include: {
        category: true,
        business: {
          select: {
            id: true,
            name: true,
            description: true,
            phone: true,
            logo: true,
            address: true,
            city: true,
            latitude: true,
            longitude: true,
            deliveryEnabled: true,
            deliveryFee: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const uniqueBusinesses = promotions.filter(
      (promotion, index, list) =>
        list.findIndex(
          (item) => item.businessId === promotion.businessId,
        ) === index,
    );

    const interval = 5 * 60 * 1000;
    const rotation =
      Math.floor(Date.now() / interval) %
      Math.max(uniqueBusinesses.length, 1);

    const rotated = [
      ...uniqueBusinesses.slice(rotation),
      ...uniqueBusinesses.slice(0, rotation),
    ];

    return rotated.slice(0, 4);
  }
}