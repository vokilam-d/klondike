import { arrayProp, prop } from '@typegoose/typegoose';
import { ClientProductListItemDto } from '../../shared/dtos/client/product-list-item.dto';
import { OrderItemAdditionalService } from './order-item-additional-service.model';
import { MultilingualText } from '../../shared/models/multilingual-text.model';

export class OrderItem {
  @prop({ _id: false })
  name: MultilingualText;

  @prop()
  productId: number;

  @prop()
  variantId: string;

  @prop()
  sku: string;

  @prop()
  vendorCode: string;

  @prop()
  price: number;

  @prop()
  oldPrice: number;

  @prop()
  qty: number;

  @prop()
  cost: number;

  @prop()
  oldCost: number;

  @prop()
  imageUrl: string;

  @prop()
  slug: string;

  @arrayProp({ items: OrderItemAdditionalService, _id: false, default: [] })
  additionalServices: OrderItemAdditionalService[];

  crossSellProducts?: ClientProductListItemDto[] = [];
}
