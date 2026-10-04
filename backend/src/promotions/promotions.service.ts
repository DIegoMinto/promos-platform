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
    where: {
      userId,
    },
  });

  if (!business) {
    throw new NotFoundException(
      'El usuario no tiene un negocio registrado',
    );
  }

  const category = await this.prisma.category.findUnique({
    where: {
      id: createPromotionDto.categoryId,
    },
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

  const startDate = new Date(
    createPromotionDto.startDate,
  );

  const endDate = new Date(
    createPromotionDto.endDate,
  );

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

  const branchIds = [
    ...new Set(createPromotionDto.branchIds),
  ];

  const branches = await this.prisma.branch.findMany({
    where: {
      id: {
        in: branchIds,
      },
      businessId: business.id,
      status: true,
    },
    select: {
      id: true,
    },
  });

  if (branches.length !== branchIds.length) {
    throw new BadRequestException(
      'Una o más sucursales no existen, están inactivas o no pertenecen a tu negocio',
    );
  }

  return this.prisma.$transaction(async (tx) => {
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
      where: {
        id: promotion.id,
      },
      include: {
        category: true,
        branches: {
          include: {
            branch: true,
          },
        },
      },
    });
  });
}

async findMyPromotions(userId: number) {
  const business = await this.prisma.business.findUnique({
    where: {
      userId,
    },
  });

  if (!business) {
    throw new NotFoundException(
      'El usuario no tiene un negocio registrado',
    );
  }

  return this.prisma.promotion.findMany({
    where: {
      businessId: business.id,
    },
    include: {
      category: true,
      branches: {
        include: {
          branch: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
}

  async findPublicPromotions() {
  const now = new Date();

  return this.prisma.promotion.findMany({
    where: {
      status: true,
      startDate: {
        lte: now,
      },
      endDate: {
        gte: now,
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
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
}

async getSummary(userId: number) {
  const business = await this.prisma.business.findUnique({
    where: {
      userId,
    },
  });

  if (!business) {
    throw new NotFoundException(
      'El usuario no tiene un negocio registrado',
    );
  }

  const now = new Date();

  const total = await this.prisma.promotion.count({
    where: {
      businessId: business.id,
    },
  });

  const active = await this.prisma.promotion.count({
    where: {
      businessId: business.id,
      status: true,
      startDate: {
        lte: now,
      },
      endDate: {
        gte: now,
      },
    },
  });

  const expiringSoon = await this.prisma.promotion.count({
    where: {
      businessId: business.id,
      status: true,
      endDate: {
        gte: now,
        lte: new Date(
          now.getTime() + 7 * 24 * 60 * 60 * 1000,
        ),
      },
    },
  });

  const categories = await this.prisma.promotion.groupBy({
    by: ['categoryId'],
    where: {
      businessId: business.id,
    },
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
    where: {
      userId,
    },
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
    updatePromotionDto.originalPrice ??
    Number(promotion.originalPrice);

  const discountPrice =
    updatePromotionDto.discountPrice ??
    Number(promotion.discountPrice);

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
      where: {
        id: updatePromotionDto.categoryId,
      },
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

    branchIds = [
      ...new Set(updatePromotionDto.branchIds),
    ];

    const branches = await this.prisma.branch.findMany({
      where: {
        id: {
          in: branchIds,
        },
        businessId: business.id,
        status: true,
      },
      select: {
        id: true,
      },
    });

    if (branches.length !== branchIds.length) {
      throw new BadRequestException(
        'Una o más sucursales no existen, están inactivas o no pertenecen a tu negocio',
      );
    }
  }

  return this.prisma.$transaction(async (tx) => {
    const updatedPromotion =
      await tx.promotion.update({
        where: {
          id: promotion.id,
        },
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
            originalPrice:
              updatePromotionDto.originalPrice,
          }),

          ...(updatePromotionDto.discountPrice !== undefined && {
            discountPrice:
              updatePromotionDto.discountPrice,
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
        where: {
          promotionId: promotion.id,
        },
      });

      await tx.promotionBranch.createMany({
        data: branchIds.map((branchId) => ({
          promotionId: promotion.id,
          branchId,
        })),
      });
    }

    return tx.promotion.findUnique({
      where: {
        id: updatedPromotion.id,
      },
      include: {
        category: true,
        branches: {
          include: {
            branch: true,
          },
        },
      },
    });
  });
}

async remove(
  userId: number,
  promotionId: number,
) {
  const business = await this.prisma.business.findUnique({
    where: {
      userId,
    },
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

  await this.prisma.promotion.delete({
    where: {
      id: promotion.id,
    },
  });

  return {
    message: 'Promoción eliminada correctamente',
  };
}

async findPublicPromotionById(id: number) {
  const now = new Date();

  const promotion = await this.prisma.promotion.findFirst({
    where: {
      id,
      status: true,
      startDate: {
        lte: now,
      },
      endDate: {
        gte: now,
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
        },
      },

      branches: {
        where: {
          branch: {
            status: true,
          },
        },

        include: {
          branch: true,
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

}