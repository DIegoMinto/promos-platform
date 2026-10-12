import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';

import {
  SubscriptionStatus,
  SubscriptionRequestStatus,
} from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class SubscriptionsService implements OnModuleInit {
  constructor(private readonly prisma: PrismaService) {}


  
  
async onModuleInit() {
  const defaults = [
    {
      code: 'FREE',
      name: 'Gratis',
      description:
        'Ideal para comenzar a promocionar tu negocio.',
      monthlyPrice: 0,
      promotionLimit: 3,
      benefits: [
        'Hasta 3 promociones activas',
        'Aparición en los resultados normales',
        'Página del negocio y ubicación',
      ],
    },
    {
      code: 'BASIC',
      name: 'Básico',
      description:
        'Para negocios que publican promociones habitualmente.',
      monthlyPrice: 29,
      promotionLimit: null,
      benefits: [
        'Promociones activas ilimitadas',
        'Aparición en los resultados normales',
        'Página del negocio y ubicación',
        'Estadísticas básicas cuando estén disponibles',
      ],
    },
    {
      code: 'FEATURED',
      name: 'Destacado',
      description:
        'Para negocios que buscan mayor visibilidad.',
      monthlyPrice: 49,
      promotionLimit: null,
      benefits: [
        'Todo lo incluido en el plan Básico',
        'Acceso a espacios rotativos de primera plana',
        'Mayor exposición en secciones de promociones destacadas',
        'Estadísticas ampliadas cuando estén disponibles',
      ],
    },
  ];

  for (const plan of defaults) {
    await this.prisma.plan.upsert({
      where: { code: plan.code },
      update: {
        name: plan.name,
        description: plan.description,
        monthlyPrice: plan.monthlyPrice,
        promotionLimit: plan.promotionLimit,
        benefits: plan.benefits,
      },
      create: {
        ...plan,
        benefits: plan.benefits,
      },
    });
  }
}


  async findActivePlans() {
    return this.prisma.plan.findMany({
      where: { status: true },
      orderBy: { monthlyPrice: 'asc' },
    });
  }

  
async findMySubscription(userId: number) {
  const business = await this.prisma.business.findUnique({
    where: { userId },
  });

  if (!business) {
    throw new NotFoundException(
      'No tienes un negocio registrado',
    );
  }

  const now = new Date();

  const [
    subscription,
    pendingRequest,
    freePlan,
    promotionsUsed,
  ] = await Promise.all([
    this.prisma.subscription.findFirst({
      where: {
        businessId: business.id,
        status: SubscriptionStatus.ACTIVE,
        startDate: { lte: now },
        endDate: { gt: now },
      },
      include: { plan: true },
      orderBy: { endDate: 'desc' },
    }),

    this.prisma.subscriptionRequest.findFirst({
      where: {
        businessId: business.id,
        status: SubscriptionRequestStatus.PENDING,
      },
      include: { plan: true },
      orderBy: { requestedAt: 'desc' },
    }),

    this.prisma.plan.findUnique({
      where: { code: 'FREE' },
    }),

    this.prisma.promotion.count({
      where: {
        businessId: business.id,
        status: true,
        endDate: { gt: now },
      },
    }),
  ]);

  const currentPlan = subscription?.plan ?? freePlan;

  if (!currentPlan) {
    throw new NotFoundException(
      'No se encontró el plan Gratis. Verifica la configuración de los planes.',
    );
  }

  const limit = currentPlan.promotionLimit;

  return {
    subscription,
    pendingRequest,

    plan: currentPlan,

    promotionUsage: {
      used: promotionsUsed,
      limit,
      remaining:
        limit === null
          ? null
          : Math.max(0, limit - promotionsUsed),
    },
  };
}


  
async requestSubscription(
  userId: number,
  planId: number,
) {
  if (!Number.isInteger(planId) || planId <= 0) {
    throw new BadRequestException(
      'El plan seleccionado no es válido',
    );
  }

  const business = await this.prisma.business.findUnique({
    where: { userId },
  });

  if (!business) {
    throw new NotFoundException(
      'No tienes un negocio registrado',
    );
  }

  const plan = await this.prisma.plan.findFirst({
    where: {
      id: planId,
      status: true,
    },
  });

  if (!plan) {
    throw new NotFoundException(
      'El plan no existe o no está disponible',
    );
  }

  if (plan.code === 'FREE' || plan.monthlyPrice.toNumber() <= 0) {
    throw new BadRequestException(
      'El plan gratuito no requiere una solicitud de suscripción',
    );
  }

  const now = new Date();

  const [
    activeSubscription,
    pendingRequest,
  ] = await Promise.all([
    this.prisma.subscription.findFirst({
      where: {
        businessId: business.id,
        status: SubscriptionStatus.ACTIVE,
        startDate: { lte: now },
        endDate: { gt: now },
      },
      include: {
        plan: true,
      },
      orderBy: {
        endDate: 'desc',
      },
    }),

    this.prisma.subscriptionRequest.findFirst({
      where: {
        businessId: business.id,
        status: SubscriptionRequestStatus.PENDING,
      },
    }),
  ]);

  if (activeSubscription?.planId === plan.id) {
    throw new ConflictException(
      'Tu negocio ya tiene este plan activo',
    );
  }

  if (pendingRequest) {
    throw new ConflictException(
      'Ya tienes una solicitud pendiente de revisión',
    );
  }

  const message = activeSubscription
    ? `Solicitud de cambio de ${activeSubscription.plan.name} a ${plan.name}`
    : `Solicitud de suscripción al plan ${plan.name}`;

  return this.prisma.subscriptionRequest.create({
    data: {
      businessId: business.id,
      planId: plan.id,
      monthlyPrice: plan.monthlyPrice,
      message,
    },
    include: {
      plan: true,
    },
  });
}

}
