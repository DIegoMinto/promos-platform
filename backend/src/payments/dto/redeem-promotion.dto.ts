
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class RedeemPromotionDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  code: string;
}
