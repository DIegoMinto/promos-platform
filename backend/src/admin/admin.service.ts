import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async getDashboardStats() {
    const [
      totalUsers,
      activeUsers,
      inactiveUsers,
      totalBusinesses,
      activeBusinesses,
      inactiveBusinesses,
      totalPromotions,
      activePromotions,
      inactivePromotions,
      totalCategories,
      activeCategories,
      inactiveCategories,
    ] = await Promise.all([
      this.prisma.user.count(),

      this.prisma.user.count({
        where: {
          status: true,
        },
      }),

      this.prisma.user.count({
        where: {
          status: false,
        },
      }),

      this.prisma.business.count(),

      this.prisma.business.count({
        where: {
          status: true,
        },
      }),

      this.prisma.business.count({
        where: {
          status: false,
        },
      }),

      this.prisma.promotion.count(),

      this.prisma.promotion.count({
        where: {
          status: true,
        },
      }),

      this.prisma.promotion.count({
        where: {
          status: false,
        },
      }),

      this.prisma.category.count(),

      this.prisma.category.count({
        where: {
          status: true,
        },
      }),

      this.prisma.category.count({
        where: {
          status: false,
        },
      }),
    ]);

    return {
      users: {
        total: totalUsers,
        active: activeUsers,
        inactive: inactiveUsers,
      },

      businesses: {
        total: totalBusinesses,
        active: activeBusinesses,
        inactive: inactiveBusinesses,
      },

      promotions: {
        total: totalPromotions,
        active: activePromotions,
        inactive: inactivePromotions,
      },

      categories: {
        total: totalCategories,
        active: activeCategories,
        inactive: inactiveCategories,
      },
    };
  }

  async getUsers() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
        updatedAt: true,

        business: {
          select: {
            id: true,
            name: true,
          },
        },
      },

      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async updateUserStatus(
    userId: number,
    status: boolean,
    currentUserId: number,
  ) {
    if (userId === currentUserId && status === false) {
      throw new BadRequestException(
        'No puedes desactivar tu propia cuenta de administrador',
      );
    }

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

    return this.prisma.user.update({
      where: {
        id: userId,
      },

      data: {
        status,
      },

      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
      },
    });
  }

  async getBusinesses() {
    return this.prisma.business.findMany({
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
        status: true,
        createdAt: true,
        updatedAt: true,

        user: {
          select: {
            id: true,
            name: true,
            email: true,
            status: true,
          },
        },
      },

      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async updateBusinessStatus(
    businessId: number,
    status: boolean,
  ) {
    const business =
      await this.prisma.business.findUnique({
        where: {
          id: businessId,
        },
      });

    if (!business) {
      throw new NotFoundException(
        'Negocio no encontrado',
      );
    }

    return this.prisma.business.update({
      where: {
        id: businessId,
      },

      data: {
        status,
      },

      select: {
        id: true,
        name: true,
        status: true,
      },
    });
  }

  async getPromotions() {
    return this.prisma.promotion.findMany({
      select: {
        id: true,
        title: true,
        description: true,
        image: true,
        originalPrice: true,
        discountPrice: true,
        startDate: true,
        endDate: true,
        status: true,
        createdAt: true,
        updatedAt: true,

        business: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },

        category: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },

        branches: {
          select: {
            branch: {
              select: {
                id: true,
                name: true,
                address: true,
                city: true,
                status: true,
              },
            },
          },
        },
      },

      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async updatePromotionStatus(
    promotionId: number,
    status: boolean,
  ) {
    const promotion =
      await this.prisma.promotion.findUnique({
        where: {
          id: promotionId,
        },
      });

    if (!promotion) {
      throw new NotFoundException(
        'Promoción no encontrada',
      );
    }

    return this.prisma.promotion.update({
      where: {
        id: promotionId,
      },

      data: {
        status,
      },

      select: {
        id: true,
        title: true,
        status: true,
      },
    });
  }

  // =========================
// CATEGORÍAS
// =========================

async getCategories() {
  return this.prisma.category.findMany({
    select: {
      id: true,
      name: true,
      description: true,
      icon: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      _count: {
        select: {
          promotions: true,
        },
      },
    },

    orderBy: {
      createdAt: 'desc',
    },
  });
}

async createCategory(
  data: {
    name: string;
    description?: string;
    icon?: string;
  },
) {
  const name = data.name.trim();

  if (!name) {
    throw new BadRequestException(
      'El nombre de la categoría es obligatorio',
    );
  }

  const existingCategory =
    await this.prisma.category.findUnique({
      where: {
        name,
      },
    });

  if (existingCategory) {
    throw new BadRequestException(
      'Ya existe una categoría con ese nombre',
    );
  }

  return this.prisma.category.create({
    data: {
      name,
      description:
        data.description?.trim() || null,
      icon:
        data.icon?.trim() || null,
    },

    select: {
      id: true,
      name: true,
      description: true,
      icon: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      _count: {
        select: {
          promotions: true,
        },
      },
    },
  });
}

async updateCategory(
  categoryId: number,
  data: {
    name?: string;
    description?: string;
    icon?: string;
  },
) {
  const category =
    await this.prisma.category.findUnique({
      where: {
        id: categoryId,
      },
    });

  if (!category) {
    throw new NotFoundException(
      'Categoría no encontrada',
    );
  }

  if (data.name !== undefined) {
    const name = data.name.trim();

    if (!name) {
      throw new BadRequestException(
        'El nombre de la categoría es obligatorio',
      );
    }

    const existingCategory =
      await this.prisma.category.findFirst({
        where: {
          name,
          NOT: {
            id: categoryId,
          },
        },
      });

    if (existingCategory) {
      throw new BadRequestException(
        'Ya existe otra categoría con ese nombre',
      );
    }
  }

  return this.prisma.category.update({
    where: {
      id: categoryId,
    },

    data: {
      ...(data.name !== undefined && {
        name: data.name.trim(),
      }),

      ...(data.description !== undefined && {
        description:
          data.description.trim() || null,
      }),

      ...(data.icon !== undefined && {
        icon:
          data.icon.trim() || null,
      }),
    },

    select: {
      id: true,
      name: true,
      description: true,
      icon: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      _count: {
        select: {
          promotions: true,
        },
      },
    },
  });
}

async updateCategoryStatus(
  categoryId: number,
  status: boolean,
) {
  const category =
    await this.prisma.category.findUnique({
      where: {
        id: categoryId,
      },
    });

  if (!category) {
    throw new NotFoundException(
      'Categoría no encontrada',
    );
  }

  return this.prisma.category.update({
    where: {
      id: categoryId,
    },

    data: {
      status,
    },

    select: {
      id: true,
      name: true,
      status: true,
    },
  });
}
}