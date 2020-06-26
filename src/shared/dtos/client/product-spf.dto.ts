import { ClientSPFDto } from './spf.dto';
import { IsNumberString, IsOptional } from 'class-validator';
import { Product } from '../../../product/models/product.model';
import { IFilter, ISorting } from '../shared-dtos/spf.dto';
import { AdminProductListItemDto } from '../admin/product-list-item.dto';
import { AdminProductVariantListItem } from '../admin/product-variant-list-item.dto';
import { AdminProductCategoryDto } from '../admin/product-category.dto';
import { Transform } from 'class-transformer';
import { ProductCategory } from '../../../product/models/product-category.model';

enum ESort {
  Popularity = 'popularity',
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

  @Transform((value, obj: ClientProductSPFDto) => {
    if (obj.categoryId) {
      const categoriesProp: keyof Product = 'categories';
      const categoryIdProp: keyof ProductCategory = 'id';
      return { [`${categoriesProp}.${categoryIdProp}`]: obj.categoryId };
    }
  })
  sortFilter: any;

  getSortAsObj(): ISorting {
    const variantsProp: keyof AdminProductListItemDto = 'variants';
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
      case ESort.Cheap:
        sort[`${variantsProp}.${priceProp}`] = 'asc';
        break;
      case ESort.Expensive:
        sort[`${variantsProp}.${priceProp}`] = 'desc';
        break;
      case ESort.Popularity:
      default:
        sort[`${categoriesProp}.${sortOrderProp}`] = 'desc';
        break;
    }

    return sort;
  }
}
