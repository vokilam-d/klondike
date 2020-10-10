import { Expose, Type } from 'class-transformer';
import { IsBoolean, IsDate, IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { CurrencyCodeEnum } from '../../enums/currency.enum';
import { TrimString } from '../../decorators/trim-string.decorator';

export class AdminCurrencyDto {
  @Expose()
  @IsEnum(CurrencyCodeEnum)
  id: CurrencyCodeEnum;

  @Expose()
  @IsString()
  @TrimString()
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
