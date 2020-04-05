import { ProductVariant } from './product-variant.model';
import { Product } from './product.model';
import { ReservedInventory } from '../../inventory/models/reserved-inventory.model';

export class ProductVariantWithQty extends ProductVariant {
  qtyInStock: number;
  reserved: ReservedInventory[];
}

export class ProductWithQty extends Product {
  variants: ProductVariantWithQty[];
}
