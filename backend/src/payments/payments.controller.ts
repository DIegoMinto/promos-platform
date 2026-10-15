
import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Request } from 'express';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { Roles } from '../auth/roles.decorator.js';
import { CloudinaryService } from '../cloudinary/cloudinary.service.js';
import { PaymentsService } from './payments.service.js';
import { SubmitPaymentDto } from './dto/submit-payment.dto.js';
import { ReviewPaymentDto } from './dto/review-payment.dto.js';
import { RedeemPromotionDto } from './dto/redeem-promotion.dto.js';

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
export class PaymentsController {
  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  @Post('orders/:orderId/payment-submissions')
  @Roles(UserRole.CLIENTE)
  @UseInterceptors(
    FileInterceptor('receipt', {
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: (_req, file, callback) => {
        const allowed = [
          'image/jpeg',
          'image/png',
          'image/webp',
          'application/pdf',
        ].includes(file.mimetype);

        if (!allowed) {
          callback(
            new BadRequestException(
              'Solo se permiten JPG, PNG, WEBP o PDF.',
            ),
            false,
          );
          return;
        }

        callback(null, true);
      },
    }),
  )
  async submitReceipt(
    @Req() request: AuthenticatedRequest,
    @Param('orderId', ParseIntPipe) orderId: number,
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body() dto: SubmitPaymentDto,
  ) {
    if (!file) {
      throw new BadRequestException(
        'Debes adjuntar el comprobante de pago.',
      );
    }
await this.paymentsService.assertCanSubmitReceipt(
  request.user.id,
  orderId,
);
    const uploaded = await this.cloudinaryService.uploadReceipt(file);

    return this.paymentsService.submitReceipt(
      request.user.id,
      orderId,
      uploaded.secure_url,
      dto,
    );
  }

  @Get('admin/payments/pending')
  @Roles(UserRole.ADMIN)
  getPendingPayments() {
    return this.paymentsService.getPendingPayments();
  }

  @Patch('admin/payments/submissions/:submissionId/review')
  @Roles(UserRole.ADMIN)
  reviewSubmission(
    @Req() request: AuthenticatedRequest,
    @Param('submissionId', ParseIntPipe) submissionId: number,
    @Body() dto: ReviewPaymentDto,
  ) {
    return this.paymentsService.reviewSubmission(
      request.user.id,
      submissionId,
      dto,
    );
  }

  @Get('redemptions/me')
  @Roles(UserRole.CLIENTE)
  getMyRedemptions(@Req() request: AuthenticatedRequest) {
    return this.paymentsService.getMyRedemptions(request.user.id);
  }

  
@Post('business/redemptions/redeem')
@Roles(UserRole.NEGOCIO)
redeemPromotion(
  @Req() request: AuthenticatedRequest,
  @Body() dto: RedeemPromotionDto,
) {
  return this.paymentsService.redeemPromotion(
    request.user.id,
    dto.code,
  );
}

}
