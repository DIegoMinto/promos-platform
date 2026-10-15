import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  FulfillmentType,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  PaymentSubmissionStatus,
  RedemptionStatus,
} from '@prisma/client';

import { randomUUID } from 'node:crypto';

import { PrismaService } from '../prisma/prisma.service.js';
import { CreateCheckoutDto } from './dto/create-checkout.dto.js';

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async createCheckout(userId: number, dto: CreateCheckoutDto) {
    const optionsByGroup = new Map(
      dto.orders.map((option) => [
        `${option.businessId}:${option.fulfillmentType}`,
        option,
      ]),
    );

    if (optionsByGroup.size !== dto.orders.length) {
      throw new BadRequestException(
        'No repitas la misma modalidad para un negocio.',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const cart = await tx.cart.findUnique({
        where: { userId },
        include: {
          items: {
            include: {
              promotion: {
                include: {
                  business: true,
                  branches: {
                    include: { branch: true },
                  },
                },
              },
            },
          },
        },
      });

      if (!cart || cart.items.length === 0) {
        throw new BadRequestException('Tu carrito está vacío.');
      }

      const now = new Date();

      const groupedItems = new Map<
        string,
        (typeof cart.items)[number][]
      >();

      for (const item of cart.items) {
        const promotion = item.promotion;
        const business = promotion.business;

        if (
          !promotion.status ||
          !business.status ||
          promotion.startDate > now ||
          promotion.endDate < now
        ) {
          throw new BadRequestException(
            `La promoción "${promotion.title}" ya no está disponible. Actualiza tu carrito.`,
          );
        }

        const groupKey =
          `${business.id}:${item.fulfillmentType}`;

        const group = groupedItems.get(groupKey) ?? [];

        group.push(item);
        groupedItems.set(groupKey, group);
      }

      if (groupedItems.size !== optionsByGroup.size) {
        throw new BadRequestException(
          'Debes seleccionar las opciones para cada negocio y modalidad del carrito.',
        );
      }

      for (const groupKey of groupedItems.keys()) {
        if (!optionsByGroup.has(groupKey)) {
          throw new BadRequestException(
            `Faltan las opciones para el grupo ${groupKey}.`,
          );
        }
      }

      const checkout = await tx.checkout.create({
        data: {
          reference: `CHK-${randomUUID()}`,
          customerId: userId,
        },
      });

      for (const [groupKey, items] of groupedItems) {
        const option = optionsByGroup.get(groupKey)!;
        const business = items[0].promotion.business;
        const fulfillmentType = items[0].fulfillmentType;
        const paymentMethod = option.paymentMethod;

if (
  fulfillmentType === FulfillmentType.DELIVERY &&
  paymentMethod !== PaymentMethod.TRANSFER
) {
  throw new BadRequestException(
    'La entrega a domicilio solo permite pago por transferencia.',
  );
}

if (
  paymentMethod === PaymentMethod.CASH_ON_PICKUP &&
  fulfillmentType !== FulfillmentType.PICKUP
) {
  throw new BadRequestException(
    'El pago en efectivo solo está disponible para recojo en sucursal.',
  );
}
        if (
          items.some(
            (item) => item.fulfillmentType !== fulfillmentType,
          ) ||
          option.fulfillmentType !== fulfillmentType
        ) {
          throw new BadRequestException(
            `La modalidad del pedido de ${business.name} no coincide con el carrito.`,
          );
        }

        if (
          fulfillmentType === FulfillmentType.DELIVERY &&
          !business.deliveryEnabled
        ) {
          throw new BadRequestException(
            `${business.name} no tiene habilitada la entrega a domicilio.`,
          );
        }

        if (
          fulfillmentType === FulfillmentType.DELIVERY &&
          !option.deliveryAddress?.trim()
        ) {
          throw new BadRequestException(
            `Debes indicar la dirección de entrega para ${business.name}.`,
          );
        }

        if (
          fulfillmentType === FulfillmentType.PICKUP &&
          !option.branchId
        ) {
          throw new BadRequestException(
            `Selecciona una sucursal para retirar el pedido de ${business.name}.`,
          );
        }

        let selectedBranchId: number | null = null;

        if (fulfillmentType === FulfillmentType.PICKUP) {
          const selectedBranch = await tx.branch.findFirst({
            where: {
              id: option.branchId,
              businessId: business.id,
              status: true,
            },
          });

          if (!selectedBranch) {
            throw new BadRequestException(
              `La sucursal seleccionada para ${business.name} no está disponible.`,
            );
          }

          const promotionsAvailableAtBranch = items.every(
            (item) =>
              item.promotion.branches.some(
                (link) =>
                  link.branchId === selectedBranch.id,
              ),
          );

          if (!promotionsAvailableAtBranch) {
            throw new BadRequestException(
              `La sucursal seleccionada no ofrece todas las promociones de ${business.name}.`,
            );
          }

          selectedBranchId = selectedBranch.id;
        }

        const subtotal = items.reduce(
          (sum, item) =>
            sum +
            Number(item.promotion.discountPrice) *
              item.quantity,
          0,
        );

        const deliveryFee =
          fulfillmentType === FulfillmentType.DELIVERY
            ? Number(business.deliveryFee)
            : 0;

        const total = Number(
          (subtotal + deliveryFee).toFixed(2),
        );

        await tx.order.create({
          data: {
            reference: `ORD-${randomUUID()}`,
            checkoutId: checkout.id,
            customerId: userId,
            businessId: business.id,
            branchId: selectedBranchId,
            fulfillmentType,
            customerName: dto.customerName.trim(),
            customerPhone: dto.customerPhone.trim(),
            deliveryAddress:
              fulfillmentType === FulfillmentType.DELIVERY
                ? option.deliveryAddress!.trim()
                : null,
            deliveryNotes:
              fulfillmentType === FulfillmentType.DELIVERY
                ? option.deliveryNotes?.trim() || null
                : null,
            subtotal: Number(subtotal.toFixed(2)),
            deliveryFee,
            total,
            items: {
              create: items.map((item) => ({
                promotionId: item.promotionId,
                promotionTitle: item.promotion.title,
                quantity: item.quantity,
                unitPrice: item.promotion.discountPrice,
                lineTotal: Number(
                  (
                    Number(item.promotion.discountPrice) *
                    item.quantity
                  ).toFixed(2),
                ),
              })),
            },
payment: {
  create: {
    amount: total,
    paymentMethod,
    qrImageUrl:
      paymentMethod === PaymentMethod.TRANSFER
        ? business.paymentQrUrl
        : null,
  },
},
          },
        });
      }

      // Vaciar el carrito solo después de crear todos los pedidos.
      await tx.cartItem.deleteMany({
        where: { cartId: cart.id },
      });

      return tx.checkout.findUniqueOrThrow({
        where: { id: checkout.id },
        include: {
          orders: {
            include: {
              items: true,
              payment: true,
              business: {
                select: {
                  id: true,
                  name: true,
                  paymentQrUrl: true,
                  phone: true,
                },
              },
              branch: true,
            },
          },
        },
      });
    });
  }
async getMyOrders(userId: number) {
  return this.prisma.order.findMany({
    where: { customerId: userId },
    include: {
      items: true,
      payment: true,
      business: {
        select: {
          id: true,
          name: true,
          phone: true,
          logo: true,
          paymentQrUrl: true,
        },
      },
      branch: true,
    },
    orderBy: { createdAt: 'desc' },
  });
}


async getBusinessOrders(userId: number) {
  const business = await this.prisma.business.findUnique({
    where: { userId },
    select: { id: true },
  });

  if (!business) {
    throw new NotFoundException(
      'No se encontró un negocio asociado a este usuario.',
    );
  }

  return this.prisma.order.findMany({
    where: {
      businessId: business.id,
    },
    include: {
      items: true,
      payment: {
        include: {
          submissions: {
            orderBy: {
              submittedAt: 'desc',
            },
            take: 1,
          },
        },
      },
      branch: true,
      customer: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
}



async updateBusinessOrderPaymentStatus(
  userId: number,
  orderId: number,
  nextStatus: PaymentStatus,
) {
  if (
    nextStatus !== PaymentStatus.APPROVED &&
    nextStatus !== PaymentStatus.REJECTED
  ) {
    throw new BadRequestException(
      'Solo puedes aprobar o rechazar un pago.',
    );
  }

  const business = await this.prisma.business.findUnique({
    where: { userId },
    select: { id: true },
  });

  if (!business) {
    throw new NotFoundException(
      'No se encontró un negocio asociado a este usuario.',
    );
  }

  return this.prisma.$transaction(async (tx) => {
    const order = await tx.order.findFirst({
      where: {
        id: orderId,
        businessId: business.id,
      },
      include: {
        payment: true,
      },
    });

    if (!order) {
      throw new NotFoundException(
        'El pedido no existe o no pertenece a tu negocio.',
      );
    }

    if (!order.payment) {
      throw new BadRequestException(
        'El pedido no tiene información de pago.',
      );
    }

    if (
      order.payment.paymentMethod !== PaymentMethod.TRANSFER
    ) {
      throw new BadRequestException(
        'Este pedido no se paga mediante transferencia.',
      );
    }

    if (
      order.payment.status !== PaymentStatus.UNDER_REVIEW ||
      order.status !== OrderStatus.PAYMENT_REVIEW
    ) {
      throw new BadRequestException(
        'El pedido no tiene un comprobante pendiente de revisión.',
      );
    }

    const submission = await tx.paymentSubmission.findFirst({
      where: {
        paymentId: order.payment.id,
        status: PaymentSubmissionStatus.PENDING,
      },
      orderBy: {
        submittedAt: 'desc',
      },
    });

    if (!submission) {
      throw new BadRequestException(
        'No se encontró un comprobante pendiente de revisión.',
      );
    }

    const approved = nextStatus === PaymentStatus.APPROVED;

    // Registrar la decisión sobre el comprobante.
    await tx.paymentSubmission.update({
      where: {
        id: submission.id,
      },
      data: {
        status: approved
          ? PaymentSubmissionStatus.APPROVED
          : PaymentSubmissionStatus.REJECTED,
        reviewedById: userId,
        reviewedAt: new Date(),
      },
    });

    // Actualizar el pago.
    await tx.payment.update({
      where: {
        orderId: order.id,
      },
      data: {
        status: nextStatus,
      },
    });

    // Aprobar confirma el pedido.
    // Rechazar permite al cliente volver a enviar su comprobante.
    const updatedOrder = await tx.order.update({
      where: {
        id: order.id,
      },
      data: {
        status: approved
          ? OrderStatus.CONFIRMED
          : OrderStatus.PENDING_PAYMENT,
      },
    });

    // Generar los códigos de las promociones al aprobar.
    if (approved) {
      const orderWithItems = await tx.order.findUniqueOrThrow({
        where: {
          id: order.id,
        },
        include: {
          items: {
            include: {
              promotion: true,
              redemptions: true,
            },
          },
        },
      });

      for (const item of orderWithItems.items) {
        for (
          let unit = item.redemptions.length;
          unit < item.quantity;
          unit++
        ) {
          await tx.promotionRedemption.create({
            data: {
              code: `CAN-${randomUUID().toUpperCase()}`,
              customerId: order.customerId,
              promotionId: item.promotionId,
              businessId: order.businessId,
              orderItemId: item.id,
              status: RedemptionStatus.REQUESTED,
              expiresAt: item.promotion.endDate,
            },
          });
        }
      }
    }

    return tx.order.findUniqueOrThrow({
      where: {
        id: updatedOrder.id,
      },
      include: {
        items: true,
        payment: {
          include: {
            submissions: {
              orderBy: {
                submittedAt: 'desc',
              },
              take: 1,
            },
          },
        },
        branch: true,
      },
    });
  });
}


async updateBusinessOrderStatus(
  userId: number,
  orderId: number,
  nextStatus: OrderStatus,
) {
  const business = await this.prisma.business.findUnique({
    where: { userId },
    select: { id: true },
  });

  if (!business) {
    throw new NotFoundException(
      'No se encontró un negocio asociado a este usuario.',
    );
  }

  const order = await this.prisma.order.findFirst({
    where: {
      id: orderId,
      businessId: business.id,
    },
  });

  if (!order) {
    throw new NotFoundException(
      'El pedido no existe o no pertenece a tu negocio.',
    );
  }

  const payment = await this.prisma.payment.findUnique({
    where: { orderId: order.id },
    select: {
      status: true,
      paymentMethod: true,
    },
  });

  if (!payment) {
    throw new BadRequestException(
      'El pedido no tiene información de pago.',
    );
  }

  const isCashPickup =
    order.fulfillmentType === FulfillmentType.PICKUP &&
    payment.paymentMethod === PaymentMethod.CASH_ON_PICKUP;

  // Flujo normal de pedidos pagados por transferencia.
  const allowedTransitions: Partial<
    Record<OrderStatus, OrderStatus[]>
  > = {
    CONFIRMED: [OrderStatus.PREPARING],

    PREPARING:
      order.fulfillmentType === FulfillmentType.PICKUP
        ? [OrderStatus.READY_FOR_PICKUP]
        : [OrderStatus.OUT_FOR_DELIVERY],

    READY_FOR_PICKUP: [OrderStatus.COMPLETED],

    OUT_FOR_DELIVERY: [OrderStatus.COMPLETED],
  };

  // El recojo en efectivo puede empezar a prepararse
  // aunque todavía no se haya cobrado.
  if (isCashPickup) {
    allowedTransitions.PENDING_PAYMENT = [
      OrderStatus.PREPARING,
    ];
  }

  const allowed = allowedTransitions[order.status] ?? [];

  if (!allowed.includes(nextStatus)) {
    throw new BadRequestException(
      `No se puede cambiar el pedido de ${order.status} a ${nextStatus}.`,
    );
  }

  // Los pedidos por transferencia requieren pago aprobado.
  if (
    !isCashPickup &&
    payment.status !== PaymentStatus.APPROVED
  ) {
    throw new BadRequestException(
      'El pedido no puede avanzar porque el pago no está aprobado.',
    );
  }

return this.prisma.$transaction(async (tx) => {
  if (
    isCashPickup &&
    nextStatus === OrderStatus.COMPLETED
  ) {
    await tx.payment.update({
      where: { orderId: order.id },
      data: {
        status: PaymentStatus.APPROVED,
      },
    });

    const orderWithItems = await tx.order.findUniqueOrThrow({
      where: { id: order.id },
      include: {
        items: {
          include: {
            promotion: true,
            redemptions: true,
          },
        },
      },
    });

    for (const item of orderWithItems.items) {
      for (
        let unit = item.redemptions.length;
        unit < item.quantity;
        unit++
      ) {
        await tx.promotionRedemption.create({
          data: {
            code: `CAN-${randomUUID().toUpperCase()}`,
            customerId: order.customerId,
            promotionId: item.promotionId,
            businessId: order.businessId,
            orderItemId: item.id,
            status: RedemptionStatus.REQUESTED,
            expiresAt: item.promotion.endDate,
          },
        });
      }
    }
  }

  return tx.order.update({
    where: { id: order.id },
    data: {
      status: nextStatus,
      ...(nextStatus === OrderStatus.COMPLETED
        ? { completedAt: new Date() }
        : {}),
    },
    include: {
      items: true,
      payment: true,
      branch: true,
    },
  });
});
}
}