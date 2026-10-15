
import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class UpdateBusinessDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string | null;

  @IsOptional()
  @IsString()
  phone?: string | null;

  @IsOptional()
  @IsString()
  logo?: string | null;

  @IsOptional()
  @IsString()
  address?: string | null;

  @IsOptional()
  @IsString()
  city?: string | null;

  @IsOptional()
  @IsNumber({
    allowNaN: false,
    allowInfinity: false,
  })
  latitude?: number | null;

  @IsOptional()
  @IsNumber({
    allowNaN: false,
    allowInfinity: false,
  })
  longitude?: number | null;

  @IsOptional()
  @IsString()
  paymentQrUrl?: string | null;

  @IsOptional()
  @IsBoolean()
  pickupEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  deliveryEnabled?: boolean;

  @IsOptional()
  @IsNumber({
    allowNaN: false,
    allowInfinity: false,
  })
  @Min(0)
  deliveryFee?: number;

  @IsOptional()
  @IsString()
  deliveryInstructions?: string | null;
}
