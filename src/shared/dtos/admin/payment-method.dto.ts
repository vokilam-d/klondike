import { Expose } from 'class-transformer';
import { IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';

export class PaymentMethodDto {
  @Expose()
  @IsOptional()
  id: string;

  @Expose()
  @IsBoolean()
  isEnabled: boolean;

  @Expose()
  @IsString()
  name: string;

  @Expose()
  @IsNumber()
  price: number;

  @Expose()
  @IsNumber()
  sortOrder: number;
}
