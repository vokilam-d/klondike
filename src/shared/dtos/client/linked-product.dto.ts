import { LinkedProduct } from '../../../product/models/linked-product.model';
import { Expose } from 'class-transformer';

export class ClientLinkedProductDto implements Omit<LinkedProduct, 'sortOrder'> {
  @Expose()
  productId: number;

  @Expose()
  variantId: string;
}
