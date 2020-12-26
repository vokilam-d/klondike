import { Expose } from 'class-transformer';
import { PaymentTypeEnum } from '../../enums/payment-type.enum';
import { PaymentMethod } from '../../../payment-method/models/payment-method.model';
import { Language } from '../../enums/language.enum';

export class ClientPaymentMethodDto implements Pick<PaymentMethod, 'paymentType' | 'price'> {
  @Expose()
  id: string;

  @Expose()
  name: string;

  @Expose()
  price: number;

  @Expose()
  paymentType: PaymentTypeEnum;

  static transformToDto(paymentMethod: PaymentMethod, lang: Language): ClientPaymentMethodDto {
    return {
      id: paymentMethod._id.toString(),
      name: paymentMethod.clientName[lang],
      paymentType: paymentMethod.paymentType,
      price: paymentMethod.price
    };
  }
}
