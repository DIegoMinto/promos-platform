
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import {
  FulfillmentType,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  PaymentSubmissionStatus,
  RedemptionStatus,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { SubmitPaymentDto } from './dto/submit-payment.dto.js';
import { ReviewPaymentDto } from './dto/review-payment.dto.js';

@Injectable()
export class PaymentsService {
  constructor(private readonly prisma: PrismaService) {}

  async assertCanSubmitReceipt(
    customerId: number,
    orderId: number,
  ) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, customerId },
      include: { payment: true },
    });

    if (!order) {
      throw new NotFoundException('Pedido no encontrado.');
    }

    if (!order.payment) {
      throw new BadRequestException(
        'Este pedido no tiene un registro de pago.',
      );
    }

    if (
      order.payment.paymentMethod !== PaymentMethod.TRANSFER
    ) {
      throw new BadRequestException(
        'Este pedido no permite enviar comprobantes de transferencia.',
      );
    }

    if (
      order.payment.status === PaymentStatus.APPROVED ||
      order.status === OrderStatus.CONFIRMED ||
      order.status === OrderStatus.COMPLETED ||
      order.status === OrderStatus.CANCELLED
    ) {
      throw new BadRequestException(
        'Este pedido no admite nuevos comprobantes de pago.',
      );
    }

    if (
      order.payment.status === PaymentStatus.UNDER_REVIEW
    ) {
      throw new BadRequestException(
        'El comprobante ya está pendiente de revisión.',
      );
    }
  }

  async submitReceipt(
    customerId: number,
    orderId: number,
    receiptUrl: string,
    dto: SubmitPaymentDto,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const order = await tx.order.findFirst({
        where: { id: orderId, customerId },
        include: { payment: true },
      });

      if (!order) {
        throw new NotFoundException('Pedido no encontrado.');
      }

      if (!order.payment) {
        throw new BadRequestException(
          'Este pedido no tiene un registro de pago.',
        );
      }

      if (
        order.payment.paymentMethod !== PaymentMethod.TRANSFER
      ) {
        throw new BadRequestException(
          'Este pedido no permite enviar comprobantes de transferencia.',
        );
      }

      if (
        order.payment.status === PaymentStatus.APPROVED ||
        order.status === OrderStatus.CONFIRMED ||
        order.status === OrderStatus.COMPLETED ||
        order.status === OrderStatus.CANCELLED
      ) {
        throw new BadRequestException(
          'Este pedido no admite nuevos comprobantes de pago.',
        );
      }

      if (
        order.payment.status === PaymentStatus.UNDER_REVIEW
      ) {
        throw new BadRequestException(
          'El comprobante ya está pendiente de revisión.',
        );
      }

      const submission = await tx.paymentSubmission.create({
        data: {
          paymentId: order.payment.id,
          receiptUrl,
          transferReference:
            dto.transferReference?.trim() || null,
          customerNote: dto.customerNote?.trim() || null,
          status: PaymentSubmissionStatus.PENDING,
        },
      });

      // El pago queda pendiente de revisión administrativa.
      await tx.payment.update({
        where: { id: order.payment.id },
        data: {
          status: PaymentStatus.UNDER_REVIEW,
        },
      });

      // El pedido todavía no está confirmado.
      await tx.order.update({
        where: { id: order.id },
        data: {
          status: OrderStatus.PAYMENT_REVIEW,
        },
      });

      return {
        message:
          'Comprobante enviado. El pago será verificado manualmente.',
        submission,
      };
    });
  }

  async getPendingPayments() {
    return this.prisma.paymentSubmission.findMany({
      where: { status: PaymentSubmissionStatus.PENDING },
      orderBy: { submittedAt: 'asc' },
      include: {
        payment: {
          include: {
            order: {
              include: {
                customer: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                  },
                },
                business: {
                  select: {
                    id: true,
                    name: true,
                    paymentQrUrl: true,
                  },
                },
                branch: true,
                items: true,
              },
            },
          },
        },
      },
    });
  }

  async reviewSubmission(
    adminId: number,
    submissionId: number,
    dto: ReviewPaymentDto,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const submission =
        await tx.paymentSubmission.findUnique({
          where: { id: submissionId },
          include: {
            payment: {
              include: {
                order: {
                  include: {
                    items: {
                      include: { promotion: true },
                    },
                  },
                },
              },
            },
          },
        });

      if (!submission) {
        throw new NotFoundException(
          'Comprobante no encontrado.',
        );
      }

      if (
        submission.status !== PaymentSubmissionStatus.PENDING
      ) {
        throw new BadRequestException(
          'Este comprobante ya fue revisado.',
        );
      }

      const { payment } = submission;
      const { order } = payment;

      if (payment.status !== PaymentStatus.UNDER_REVIEW) {
        throw new BadRequestException(
          'El pago ya no está pendiente de revisión.',
        );
      }

      if (
        payment.paymentMethod !== PaymentMethod.TRANSFER
      ) {
        throw new BadRequestException(
          'Este pago no corresponde a una transferencia.',
        );
      }

      if (
        order.status === OrderStatus.CANCELLED ||
        order.status === OrderStatus.COMPLETED
      ) {
        throw new BadRequestException(
          'No se puede revisar el pago de un pedido cancelado o completado.',
        );
      }

      const approved = dto.decision === 'APPROVED';
      const reviewedAt = new Date();
      const reviewerNote =
        dto.reviewerNote?.trim() || null;

      // Registrar la decisión sobre el comprobante.
      await tx.paymentSubmission.update({
        where: { id: submission.id },
        data: {
          status: approved
            ? PaymentSubmissionStatus.APPROVED
            : PaymentSubmissionStatus.REJECTED,
          reviewerNote,
          reviewedById: adminId,
          reviewedAt,
        },
      });

      // Actualizar el pago una sola vez.
      // reviewedAt pertenece a PaymentSubmission, no a Payment.
      await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: approved
            ? PaymentStatus.APPROVED
            : PaymentStatus.REJECTED,
          reviewNotes: reviewerNote,
        },
      });

      // Confirmar el pedido solo si se aprueba el pago.
      await tx.order.update({
        where: { id: order.id },
        data: {
          status: approved
            ? OrderStatus.CONFIRMED
            : OrderStatus.PENDING_PAYMENT,
        },
      });

      let redemptionsCreated = 0;

      if (approved) {
        for (const item of order.items) {
          for (let unit = 0; unit < item.quantity; unit++) {
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

            redemptionsCreated++;
          }
        }
      }

      return {
        message: approved
          ? 'Pago aprobado y pedido confirmado.'
          : 'Pago rechazado. El cliente puede enviar otro comprobante.',
        orderId: order.id,
        status: approved
          ? OrderStatus.CONFIRMED
          : OrderStatus.PENDING_PAYMENT,
        redemptionsCreated,
      };
    });
  }

  async getMyRedemptions(customerId: number) {
    return this.prisma.promotionRedemption.findMany({
      where: { customerId },
      orderBy: { createdAt: 'desc' },
      include: {
        promotion: {
          select: {
            id: true,
            title: true,
            image: true,
            endDate: true,
          },
        },
        business: {
          select: {
            id: true,
            name: true,
          },
        },
        orderItem: {
          include: {
            order: {
              select: {
                id: true,
                reference: true,
                status: true,
              },
            },
          },
        },
      },
    });
  }

  async createCashPickupRedemptions(
    tx: Parameters<
      Parameters<PrismaService['$transaction']>[0]
    >[0],
    orderId: number,
  ) {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            promotion: true,
            redemptions: true,
          },
        },
        payment: true,
      },
    });

    if (!order || !order.payment) {
      throw new NotFoundException(
        'No se encontró el pedido o su pago.',
      );
    }

    if (
      order.fulfillmentType !== FulfillmentType.PICKUP ||
      order.payment.paymentMethod !==
        PaymentMethod.CASH_ON_PICKUP
    ) {
      throw new BadRequestException(
        'El pedido no corresponde a un pago en efectivo en sucursal.',
      );
    }

    if (order.payment.status !== PaymentStatus.APPROVED) {
      throw new BadRequestException(
        'El pago en efectivo todavía no está confirmado.',
      );
    }

    let redemptionsCreated = 0;

    for (const item of order.items) {
      const existingCount = item.redemptions.length;

      for (
        let unit = existingCount;
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

        redemptionsCreated++;
      }
    }

    return { redemptionsCreated };
  }

  async redeemPromotion(
    businessUserId: number,
    rawCode: string,
  ) {
    const code = rawCode.trim();

    if (!code) {
      throw new BadRequestException(
        'Debes ingresar un código.',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const business = await tx.business.findUnique({
        where: { userId: businessUserId },
        select: { id: true, name: true },
      });

      if (!business) {
        throw new NotFoundException(
          'No se encontró un negocio asociado a este usuario.',
        );
      }

      const redemption =
        await tx.promotionRedemption.findUnique({
          where: { code },
          include: {
            promotion: {
              select: {
                id: true,
                title: true,
                endDate: true,
              },
            },
            orderItem: {
              include: {
                order: {
                  include: {
                    payment: {
                      select: {
                        status: true,
                        paymentMethod: true,
                      },
                    },
                  },
                },
              },
            },
          },
        });

      if (!redemption) {
        throw new NotFoundException(
          'El código de canje no existe.',
        );
      }

      if (redemption.businessId !== business.id) {
        throw new BadRequestException(
          'Este código no pertenece a tu negocio.',
        );
      }

      if (
        redemption.status !== RedemptionStatus.REQUESTED
      ) {
        throw new BadRequestException(
          'Este código ya fue utilizado o cancelado.',
        );
      }

      if (
        !redemption.orderItem ||
        redemption.orderItem.order.payment?.status !==
          PaymentStatus.APPROVED
      ) {
        throw new BadRequestException(
          'El pedido asociado no tiene un pago aprobado.',
        );
      }

      if (
        redemption.expiresAt &&
        redemption.expiresAt < new Date()
      ) {
        throw new BadRequestException(
          'Este código de canje ha vencido.',
        );
      }

      const updated =
        await tx.promotionRedemption.updateMany({
          where: {
            id: redemption.id,
            businessId: business.id,
            status: RedemptionStatus.REQUESTED,
          },
          data: {
            status: RedemptionStatus.REDEEMED,
            redeemedAt: new Date(),
            validatedById: businessUserId,
          },
        });

      if (updated.count !== 1) {
        throw new BadRequestException(
          'El código ya fue utilizado o está siendo procesado.',
        );
      }

      return {
        message: 'Promoción canjeada correctamente.',
        code: redemption.code,
        promotion: redemption.promotion.title,
        business: business.name,
        redeemedAt: new Date(),
      };
    });
  }
}
