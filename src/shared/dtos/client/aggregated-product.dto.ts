import { Expose } from 'class-transformer';
import { ProductVariant } from '../../../product/models/product-variant.model';

export class ClientAggregatedProductDto implements Pick<ProductVariant, 'slug' | 'name' | 'sku' | 'price'> {

  @Expose()
  mediaUrl: string;

  @Expose()
  slug: string;

  @Expose()
  name: string;

  @Expose()
  sku: string;

  @Expose()
  price: number;
}
