import { Expose, Type } from 'class-transformer';
import { IsBoolean, IsDate, IsEnum, IsNumber, IsString } from 'class-validator';
import { ECurrency } from '../../enums/currency.enum';

export class AdminCurrencyDto {
  @Expose()
  @IsEnum(ECurrency)
  id: ECurrency;

  @Expose()
  @IsString()
  label: string;

  @Expose()
  @IsNumber()
  exchangeRate: number;

  @Expose()
  @IsBoolean()
  isDefault: boolean;

  @Expose()
  @IsDate()
  @Type(() => Date)
  updatedAt: Date;
}
