
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class SubmitPaymentDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  transferReference?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  customerNote?: string;
}
