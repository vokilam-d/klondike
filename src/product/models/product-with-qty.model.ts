import { ProductVariant } from './product-variant.model';
import { Product } from './product.model';

export class ProductVariantWithQty extends ProductVariant {
  qty: number;
}

export class ProductWithQty extends Product {
  variants: ProductVariantWithQty[];
}
