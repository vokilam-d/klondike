import { Expose, Type } from 'class-transformer';
import { IsBoolean, IsDate, IsEnum, IsNumber, IsOptional } from 'class-validator';
import { CurrencyCodeEnum } from '../../enums/currency.enum';
import { Currency } from '../../../currency/models/currency.model';
import { MultilingualTextDto } from '../shared-dtos/multilingual-text.dto';

export class AdminCurrencyDto implements Omit<Currency, '_id'> {
  @Expose()
  @IsEnum(CurrencyCodeEnum)
  id: CurrencyCodeEnum;

  @Expose()
  @Type(() => MultilingualTextDto)
  label: MultilingualTextDto;

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
