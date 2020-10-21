import { prop } from '@typegoose/typegoose';
import { ClientProductListItemDto } from '../../shared/dtos/client/product-list-item.dto';

export class OrderItem {
  @prop()
  name: string;

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

  crossSellProducts: ClientProductListItemDto[] = [];
}
