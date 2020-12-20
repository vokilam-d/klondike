import { Expose, Transform } from 'class-transformer';
import { PaymentTypeEnum } from '../../enums/payment-type.enum';
import { PaymentMethod } from '../../../payment-method/models/payment-method.model';
import { clientDefaultLanguage } from '../../constants';

export class ClientPaymentMethodDto implements Pick<PaymentMethod, 'paymentType' | 'price'> {
  @Expose()
  @Transform(((value, obj) => obj._id || value))
  id: string;

  @Expose()
  @Transform(((value: string, obj: PaymentMethod): string => value ? value : obj.clientName[clientDefaultLanguage]))
  name: string;

  @Expose()
  price: number;

  @Expose()
  paymentType: PaymentTypeEnum;
}
