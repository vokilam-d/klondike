import { LinkedProduct } from '../../../product/models/linked-product.model';
import { Expose } from 'class-transformer';

export class ClientLinkedProductDto implements Record<keyof Omit<LinkedProduct, 'sortOrder'>, any> {
  @Expose()
  productId: number;

  @Expose()
  variantId: string;
}
