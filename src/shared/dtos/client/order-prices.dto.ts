import { BaseOrderPricesDto } from '../shared-dtos/base-order-prices.dto';
import { Expose } from 'class-transformer';
import { OrderPrices } from '../../models/order-prices.model';
import { Language } from '../../enums/language.enum';

export class ClientOrderPricesDto extends BaseOrderPricesDto {
  @Expose()
  discountLabel: string;

  static transformToDto(orderPrices: OrderPrices, lang: Language): ClientOrderPricesDto {
    return {
      discountLabel: orderPrices.discountLabel[lang],
      discountPercent: orderPrices.discountPercent,
      discountValue: orderPrices.discountValue,
      itemsCost: orderPrices.itemsCost,
      totalCost: orderPrices.totalCost
    };
  }
}
