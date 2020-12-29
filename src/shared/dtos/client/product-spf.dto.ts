import { ClientSPFDto } from './spf.dto';
import { IsNumberString, IsOptional } from 'class-validator';
import { Product } from '../../../product/models/product.model';
import { ISorting } from '../shared-dtos/spf.dto';
import { AdminProductListItemDto } from '../admin/product-list-item.dto';
import { AdminProductVariantListItemDto } from '../admin/product-variant-list-item.dto';
import { AdminProductCategoryDto } from '../admin/product-category.dto';
import { ProductCategory } from '../../../product/models/product-category.model';
import { EProductsSort } from '../../enums/product-sort.enum';

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
    const priceProp: keyof AdminProductVariantListItemDto = 'priceInDefaultCurrency';
    const categoriesProp: keyof AdminProductListItemDto = 'categories';
    const sortOrderProp: keyof AdminProductCategoryDto = 'reversedSortOrder';
    const qtyProp: keyof AdminProductVariantListItemDto = 'sellableQty';
    const salesCountProp: keyof AdminProductVariantListItemDto = 'salesCount';

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
      case EProductsSort.SalesCount:
        sort[`${variantsProp}.${salesCountProp}`] = 'desc';
        break;
      case EProductsSort.Popularity:
      default:
        if (this.categoryId) {
          sort[`${categoriesProp}.${sortOrderProp}`] = 'asc';
        }
        break;
    }

    return sort;
  }
}
