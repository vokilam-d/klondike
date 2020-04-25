import { Expose, Type } from 'class-transformer';
import { IsBoolean, IsDate, IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { CurrencyCodeEnum } from '../../enums/currency.enum';

export class AdminCurrencyDto {
  @Expose()
  @IsEnum(CurrencyCodeEnum)
  id: CurrencyCodeEnum;

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
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  updatedAt: Date;
}
