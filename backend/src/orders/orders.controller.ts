
import {
  Body,
  Controller,
  Get,
  Post,
  Patch,
  Param,
  ParseIntPipe,
  Req,
  UseGuards,
} from '@nestjs/common';

import { Request } from 'express';
import { UserRole } from '@prisma/client';

import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { Roles } from '../auth/roles.decorator.js';

import { OrdersService } from './orders.service.js';
import { CreateCheckoutDto } from './dto/create-checkout.dto.js';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto.js';

import { UpdatePaymentStatusDto } from './dto/update-payment-status.dto.js';

interface AuthenticatedRequest extends Request {
  user: {
    id: number;
    name: string;
    email: string;
    role: UserRole;
  };
}

@Controller('api')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OrdersController {
  constructor(
    private readonly ordersService: OrdersService,
  ) {}

  @Post('checkouts')
  @Roles(UserRole.CLIENTE)
  createCheckout(
    @Req() request: AuthenticatedRequest,
    @Body() dto: CreateCheckoutDto,
  ) {
    return this.ordersService.createCheckout(
      request.user.id,
      dto,
    );
  }

  @Get('orders/me')
  @Roles(UserRole.CLIENTE)
  getMyOrders(@Req() request: AuthenticatedRequest) {
    return this.ordersService.getMyOrders(
      request.user.id,
    );
  }

  @Get('business/orders')
  @Roles(UserRole.NEGOCIO)
  getBusinessOrders(
    @Req() request: AuthenticatedRequest,
  ) {
    return this.ordersService.getBusinessOrders(
      request.user.id,
    );
  }

  @Patch('business/orders/:orderId/status')
  @Roles(UserRole.NEGOCIO)
  updateBusinessOrderStatus(
    @Req() request: AuthenticatedRequest,
    @Param('orderId', ParseIntPipe) orderId: number,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return this.ordersService.updateBusinessOrderStatus(
      request.user.id,
      orderId,
      dto.status,
    );
  }

  @Patch('business/orders/:orderId/payment')
@Roles(UserRole.NEGOCIO)
updateBusinessOrderPaymentStatus(
  @Req() request: AuthenticatedRequest,
  @Param('orderId', ParseIntPipe) orderId: number,
  @Body() dto: UpdatePaymentStatusDto,
) {
  return this.ordersService.updateBusinessOrderPaymentStatus(
    request.user.id,
    orderId,
    dto.status,
  );
}
}
