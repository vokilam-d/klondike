import { Expose, Transform, Type } from 'class-transformer';
import { IsBoolean, IsNumber } from 'class-validator';
import { MultilingualTextDto } from '../shared-dtos/multilingual-text.dto';
import { PaymentMethod } from '../../../payment-method/models/payment-method.model';
import { PaymentTypeEnum } from '../../enums/payment-type.enum';

export class AdminPaymentMethodDto implements Omit<PaymentMethod, '_id'> {
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

  @Expose()
  paymentType: PaymentTypeEnum;
}
