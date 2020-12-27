import { Expose, Transform } from 'class-transformer';
import { ShippingMethod } from '../../../shipping-method/models/shipping-method.model';
import { Language } from '../../enums/language.enum';

export class ClientShippingMethodDto implements Pick<ShippingMethod, 'price'> {
  @Expose()
  @Transform(((value, obj) => obj._id || value))
  id: string;

  @Expose()
  name: string;

  @Expose()
  price: number;

  static transformToDto(shippingMethod: ShippingMethod, lang: Language): ClientShippingMethodDto {
    return {
      id: shippingMethod._id.toString(),
      name: shippingMethod.clientName[lang],
      price: shippingMethod.price
    };
  }
}
