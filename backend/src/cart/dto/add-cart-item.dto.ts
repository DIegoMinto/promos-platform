
import {
  IsEnum,
  IsInt,
  IsPositive,
  Max,
  Min,
} from 'class-validator';

import { FulfillmentType } from '@prisma/client';

export class AddCartItemDto {
  @IsInt()
  @IsPositive()
  promotionId: number;

  @IsInt()
  @Min(1)
  @Max(99)
  quantity: number = 1;

  @IsEnum(FulfillmentType)
  fulfillmentType: FulfillmentType = FulfillmentType.DELIVERY;
}
