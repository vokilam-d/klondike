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
  originalPrice: number;

  @prop()
  price: number;

  @prop()
  qty: number;

  @prop()
  cost: number;

  @prop()
  discountValue: number;

  @prop()
  totalCost: number;

  @prop()
  imageUrl: string;

  @prop()
  slug: string;

  crossSellProducts: ClientProductListItemDto[] = [];
}
