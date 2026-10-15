
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service.js';
import { AddCartItemDto } from './dto/add-cart-item.dto.js';
import { UpdateCartItemDto } from './dto/update-cart-item.dto.js';

@Injectable()
export class CartService {
  constructor(private readonly prisma: PrismaService) {}

  private async getOrCreateCart(userId: number) {
    return this.prisma.cart.upsert({
      where: { userId },
      create: { userId },
      update: {},
    });
  }

  private async getCartResponse(userId: number) {
    const cart = await this.getOrCreateCart(userId);

    const items = await this.prisma.cartItem.findMany({
      where: { cartId: cart.id },
      include: {
        promotion: {
          include: {
            business: {
  select: {
    id: true,
    name: true,
    status: true,
    logo: true,
    deliveryEnabled: true,
    deliveryFee: true,
    deliveryInstructions: true,
    pickupEnabled: true,
  },
},
            category: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const now = new Date();

    const formattedItems = items.map((item) => {
      const promotion = item.promotion;
      const unitPrice = Number(promotion.discountPrice);

      const available =
        promotion.status &&
        promotion.business.status &&
        promotion.startDate <= now &&
        promotion.endDate >= now;

      return {
        id: item.id,
        promotionId: promotion.id,
        title: promotion.title,
        image: promotion.image,
        business: promotion.business,
        category: promotion.category,
        quantity: item.quantity,
        fulfillmentType: item.fulfillmentType,
        unitPrice,
        lineTotal: unitPrice * item.quantity,
        available,
        unavailableReason: available
          ? null
          : 'Esta promoción ya no está disponible.',
      };
    });

    const subtotal = formattedItems.reduce(
      (total, item) => total + item.lineTotal,
      0,
    );

    return {
      id: cart.id,
      items: formattedItems,
      itemCount: formattedItems.reduce(
        (total, item) => total + item.quantity,
        0,
      ),
      subtotal: Number(subtotal.toFixed(2)),
      updatedAt: cart.updatedAt,
    };
  }

  async getCart(userId: number) {
    return this.getCartResponse(userId);
  }

  async addItem(userId: number, dto: AddCartItemDto) {
    const now = new Date();

    const promotion = await this.prisma.promotion.findFirst({
      where: {
        id: dto.promotionId,
        status: true,
        startDate: { lte: now },
        endDate: { gte: now },
        business: { status: true },
      },
      select: { id: true },
    });

    if (!promotion) {
      throw new NotFoundException(
        'La promoción no existe o ya no está disponible.',
      );
    }

    const cart = await this.getOrCreateCart(userId);

    const existingItem = await this.prisma.cartItem.findUnique({
      where: {
        cartId_promotionId_fulfillmentType: {
          cartId: cart.id,
          promotionId: dto.promotionId,
          fulfillmentType: dto.fulfillmentType,
        },
      },
    });

    const quantityToSave =
      (existingItem?.quantity ?? 0) + dto.quantity;

    if (quantityToSave > 99) {
      throw new BadRequestException(
        'No puedes agregar más de 99 unidades de una promoción.',
      );
    }

    await this.prisma.cartItem.upsert({
      where: {
        cartId_promotionId_fulfillmentType: {
          cartId: cart.id,
          promotionId: dto.promotionId,
          fulfillmentType: dto.fulfillmentType,
        },
      },
      create: {
        cartId: cart.id,
        promotionId: dto.promotionId,
        quantity: dto.quantity,
        fulfillmentType: dto.fulfillmentType,
      },
      update: {
        quantity: quantityToSave,
      },
    });

    return this.getCartResponse(userId);
  }

  async updateItem(
    userId: number,
    itemId: number,
    dto: UpdateCartItemDto,
  ) {
    const cart = await this.getOrCreateCart(userId);

    const result = await this.prisma.cartItem.updateMany({
      where: {
        id: itemId,
        cartId: cart.id,
      },
      data: {
        quantity: dto.quantity,
      },
    });

    if (result.count === 0) {
      throw new NotFoundException(
        'El artículo no existe en tu carrito.',
      );
    }

    return this.getCartResponse(userId);
  }

  async removeItem(userId: number, itemId: number) {
    const cart = await this.getOrCreateCart(userId);

    const result = await this.prisma.cartItem.deleteMany({
      where: {
        id: itemId,
        cartId: cart.id,
      },
    });

    if (result.count === 0) {
      throw new NotFoundException(
        'El artículo no existe en tu carrito.',
      );
    }

    return this.getCartResponse(userId);
  }

  async clearCart(userId: number) {
    const cart = await this.getOrCreateCart(userId);

    await this.prisma.cartItem.deleteMany({
      where: { cartId: cart.id },
    });

    return this.getCartResponse(userId);
  }
}
