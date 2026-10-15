import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { FulfillmentType,
  PaymentMethod,
 } from '@prisma/client';

class BusinessOrderOptionDto {
  @IsInt()
  @Min(1)
  businessId: number;

  @IsEnum(FulfillmentType)
  fulfillmentType: FulfillmentType;

  @IsOptional()
  @IsInt()
  @Min(1)
  branchId?: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  deliveryAddress?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  deliveryNotes?: string;

  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;
}

export class CreateCheckoutDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  customerName: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(40)
  customerPhone: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => BusinessOrderOptionDto)
  orders: BusinessOrderOptionDto[];
}