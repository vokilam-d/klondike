import { BaseOrderPricesDto } from '../shared-dtos/base-order-prices.dto';
import { OrderPrices } from '../../models/order-prices.model';
import { Language } from '../../enums/language.enum';

export class ClientOrderPricesDto extends BaseOrderPricesDto {
  static transformToDto(orderPrices: OrderPrices, lang: Language): ClientOrderPricesDto {
    return {
      discountValue: orderPrices.discountValue,
      itemsCost: orderPrices.itemsCost,
      totalCost: orderPrices.totalCost
    };
  }
}
