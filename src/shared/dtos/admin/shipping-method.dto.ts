import { Expose, Transform, Type } from 'class-transformer';
import { IsBoolean, IsNumber } from 'class-validator';
import { ShippingMethod } from '../../../shipping-method/models/shipping-method.model';
import { MultilingualTextDto } from '../shared-dtos/multilingual-text.dto';

export class AdminShippingMethodDto implements Omit<ShippingMethod, '_id'> {
  @Expose()
  @Transform(((value, obj) => obj._id || value))
  id: string;

  @Expose()
  @IsBoolean()
  isEnabled: boolean;

  @Expose()
  @Type(() => MultilingualTextDto)
  clientName: MultilingualTextDto;

  @Expose()
  @Type(() => MultilingualTextDto)
  adminName: MultilingualTextDto;

  @Expose()
  @IsNumber()
  price: number;

  @Expose()
  @IsNumber()
  sortOrder: number;
}
