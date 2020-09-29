import { ClientSPFDto } from './spf.dto';
import { IsNumberString, IsOptional } from 'class-validator';
import { Product } from '../../../product/models/product.model';
import { ISorting } from '../shared-dtos/spf.dto';
import { AdminProductListItemDto } from '../admin/product-list-item.dto';
import { AdminProductVariantListItem } from '../admin/product-variant-list-item.dto';
import { AdminProductCategoryDto } from '../admin/product-category.dto';
import { ProductCategory } from '../../../product/models/product-category.model';

enum EProductsSort {
  Popularity = 'popularity',
  New = 'new',
  Cheap = 'cheap',
  Expensive = 'expensive'
}

export class ClientProductSPFDto extends ClientSPFDto {
  @IsOptional()
  sort?;

  @IsOptional()
  @IsNumberString()
  categoryId?: string;

  @IsOptional()
  id?: string;

  get sortFilter(): any {
    if (this.categoryId && this.sort === EProductsSort.Popularity) {
      const categoriesProp: keyof Product = 'categories';
      const categoryIdProp: keyof ProductCategory = 'id';
      return { [`${categoriesProp}.${categoryIdProp}`]: this.categoryId };
    }
  }

  autocomplete?: any;

  getSortAsObj(): ISorting {
    const variantsProp: keyof AdminProductListItemDto = 'variants';
    const createdAtProp: keyof AdminProductListItemDto = 'createdAt';
    const priceProp: keyof AdminProductVariantListItem = 'priceInDefaultCurrency';
    const categoriesProp: keyof AdminProductListItemDto = 'categories';
    const sortOrderProp: keyof AdminProductCategoryDto = 'sortOrder';
    const qtyProp: keyof AdminProductVariantListItem = 'sellableQty';

    const sort: ISorting = {
      '_script': {
        nested: {
          path: variantsProp
        },
        type: 'number',
        script: {
          lang: 'painless',
          source: `def qty = doc['${variantsProp}.${qtyProp}'].value; return qty > 0 ? 0 : 1`
        }
      }
    };

    switch (this.sort) {
      case EProductsSort.Cheap:
        sort[`${variantsProp}.${priceProp}`] = 'asc';
        break;
      case EProductsSort.Expensive:
        sort[`${variantsProp}.${priceProp}`] = 'desc';
        break;
      case EProductsSort.New:
        sort[createdAtProp] = 'desc';
        break;
      case EProductsSort.Popularity:
      default:
        if (this.categoryId) {
          sort[`${categoriesProp}.${sortOrderProp}`] = 'desc';
        }
        break;
    }

    return sort;
  }
}
