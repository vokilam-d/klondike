import { BaseOrderItemDto } from '../shared-dtos/base-order-item.dto';
import { Expose, Type } from 'class-transformer';
import { ClientOrderItemAdditionalServiceDto } from './order-item-additional-service.dto';
import { ClientProductListItemDto } from './product-list-item.dto';
import { OrderItem } from '../../../order/models/order-item.model';
import { Language } from '../../enums/language.enum';

export class ClientOrderItemDto extends BaseOrderItemDto {
  @Expose()
  name: string;

  @Expose()
  @Type(() => ClientOrderItemAdditionalServiceDto)
  additionalServices: ClientOrderItemAdditionalServiceDto[];

  @Expose()
  crossSellProducts?: ClientProductListItemDto[];

  static transformToDto(orderItem: OrderItem, lang: Language): ClientOrderItemDto {
    return {
      additionalServices: orderItem.additionalServices.map(service => ClientOrderItemAdditionalServiceDto.transformToDto(service, lang)),
      cost: orderItem.cost,
      imageUrl: orderItem.imageUrl,
      name: orderItem.name[lang],
      oldCost: orderItem.oldCost,
      oldPrice: orderItem.oldPrice,
      price: orderItem.price,
      productId: orderItem.productId,
      qty: orderItem.qty,
      sku: orderItem.sku,
      slug: orderItem.slug,
      variantId: orderItem.variantId,
      vendorCode: orderItem.vendorCode
    };
  }
}
