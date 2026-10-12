import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  SubscriptionRequestStatus,
  SubscriptionStatus,
} from '@prisma/client';

import { Prisma } from '@prisma/client';

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


  // =========================
  // SOLICITUDES DE SUSCRIPCIÓN
  // =========================

  async getSubscriptionRequests(status?: string) {
    const validStatuses = Object.values(
      SubscriptionRequestStatus,
    );

    if (
      status &&
      !validStatuses.includes(
        status as SubscriptionRequestStatus,
      )
    ) {
      throw new BadRequestException(
        'El estado de solicitud no es válido',
      );
    }

    return this.prisma.subscriptionRequest.findMany({
      where: status
        ? {
            status: status as SubscriptionRequestStatus,
          }
        : undefined,

      include: {
        business: {
          select: {
            id: true,
            name: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        plan: true,
        reviewedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        subscription: true,
      },

      orderBy: {
        requestedAt: 'desc',
      },
    });
  }

  
async approveSubscriptionRequest(
  requestId: number,
  adminId: number,
) {
  return this.prisma.$transaction(async (tx) => {
    const request =
      await tx.subscriptionRequest.findUnique({
        where: { id: requestId },
        include: { plan: true },
      });

    if (!request) {
      throw new NotFoundException(
        'Solicitud de suscripción no encontrada',
      );
    }

    if (
      request.status !==
      SubscriptionRequestStatus.PENDING
    ) {
      throw new BadRequestException(
        'Esta solicitud ya fue revisada',
      );
    }

    const now = new Date();

    // 1. Marcar como vencidas las suscripciones
    // anteriores que ya terminaron.
    await tx.subscription.updateMany({
      where: {
        businessId: request.businessId,
        status: SubscriptionStatus.ACTIVE,
        endDate: { lte: now },
      },
      data: {
        status: SubscriptionStatus.EXPIRED,
      },
    });

    // 2. Buscar una suscripción actualmente vigente.
    const activeSubscription =
      await tx.subscription.findFirst({
        where: {
          businessId: request.businessId,
          status: SubscriptionStatus.ACTIVE,
          startDate: { lte: now },
          endDate: { gt: now },
        },
      });

    // 3. Si ya tiene una suscripción, finalizarla
    // antes de activar el nuevo plan.
    if (activeSubscription) {
      await tx.subscription.update({
        where: { id: activeSubscription.id },
        data: {
          status: SubscriptionStatus.CANCELLED,
          endDate: now,
        },
      });
    }

    // 4. Calcular un mes de vigencia sin
    // desbordamientos en meses más cortos.
    const startDate = now;
    const endDate = new Date(startDate);
    const originalDay = endDate.getDate();

    endDate.setDate(1);
    endDate.setMonth(endDate.getMonth() + 1);

    const lastDayOfMonth = new Date(
      endDate.getFullYear(),
      endDate.getMonth() + 1,
      0,
    ).getDate();

    endDate.setDate(
      Math.min(originalDay, lastDayOfMonth),
    );

    // 5. Crear la nueva suscripción.
    const subscription =
      await tx.subscription.create({
        data: {
          businessId: request.businessId,
          planId: request.planId,
          status: SubscriptionStatus.ACTIVE,
          monthlyPrice: request.monthlyPrice,
          startDate,
          endDate,
        },
      });

    // 6. Aprobar la solicitud solo si continúa
    // pendiente. Si falla, toda la transacción
    // se revierte.
    const result =
      await tx.subscriptionRequest.updateMany({
        where: {
          id: requestId,
          status: SubscriptionRequestStatus.PENDING,
        },
        data: {
          status: SubscriptionRequestStatus.APPROVED,
          reviewedById: adminId,
          reviewedAt: now,
          subscriptionId: subscription.id,
          adminNotes: null,
        },
      });

    if (result.count !== 1) {
      throw new ConflictException(
        'La solicitud ya fue procesada por otro administrador',
      );
    }

    // 7. Devolver la solicitud con sus relaciones.
    return tx.subscriptionRequest.findUnique({
      where: { id: requestId },
      include: {
        business: true,
        plan: true,
        subscription: true,
        reviewedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  });
}

  async rejectSubscriptionRequest(
    requestId: number,
    adminId: number,
    adminNotes?: string,
  ) {
    const request =
      await this.prisma.subscriptionRequest.findUnique({
        where: { id: requestId },
      });

    if (!request) {
      throw new NotFoundException(
        'Solicitud de suscripción no encontrada',
      );
    }

    if (
      request.status !==
      SubscriptionRequestStatus.PENDING
    ) {
      throw new BadRequestException(
        'Esta solicitud ya fue revisada',
      );
    }

    const notes = adminNotes?.trim();

    if (!notes) {
      throw new BadRequestException(
        'Debes indicar el motivo del rechazo',
      );
    }

    const result =
      await this.prisma.subscriptionRequest.updateMany({
        where: {
          id: requestId,
          status: SubscriptionRequestStatus.PENDING,
        },
        data: {
          status: SubscriptionRequestStatus.REJECTED,
          reviewedById: adminId,
          reviewedAt: new Date(),
          adminNotes: notes,
        },
      });

    if (result.count !== 1) {
      throw new ConflictException(
        'La solicitud ya fue procesada por otro administrador',
      );
    }

    return this.prisma.subscriptionRequest.findUnique({
      where: { id: requestId },
      include: {
        business: true,
        plan: true,
        reviewedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

}