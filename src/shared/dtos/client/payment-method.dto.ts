import { Expose, Transform } from 'class-transformer';
import { PaymentTypeEnum } from '../../enums/payment-type.enum';

export class ClientPaymentMethodDto {
  @Expose()
  @Transform(((value, obj) => obj._id || value))
  id: string;

  @Expose()
  @Transform(((value, obj) => value ? value : obj.clientName))
  name: string;

  @Expose()
  price: number;

  @Expose()
  paymentType: PaymentTypeEnum;
}
