import { ClientSortingPaginatingFilterDto } from './spf.dto';
import { IsEnum, IsNumber, IsNumberString, IsOptional } from 'class-validator';
import { getPropertyOf } from '../../helpers/get-property-of.function';
import { Product } from '../../../product/models/product.model';
import { IFilter, ISorting } from '../shared-dtos/spf.dto';
import { AdminProductListItemDto } from '../admin/product-list-item.dto';
import { AdminProductVariantListItem } from '../admin/product-variant-list-item.dto';
import { AdminProductCategoryDto } from '../admin/product-category.dto';

enum ESort {
  Popularity = 'popularity',
  Cheap = 'cheap',
  Expensive = 'expensive'
}

export class ClientProductSortingPaginatingFilterDto extends ClientSortingPaginatingFilterDto {
  @IsOptional()
  sort;

  @IsOptional()
  @IsNumberString()
  categoryId: string;

  getSortAsObj(): ISorting {
    const variantsProp: keyof AdminProductListItemDto = 'variants';
    const priceProp: keyof AdminProductVariantListItem = 'priceInDefaultCurrency';
    const sortOrderProp: keyof AdminProductListItemDto = 'sortOrder';

    switch (this.sort) {
      case ESort.Cheap:
        return { [`${variantsProp}.${priceProp}`]: 'asc' };
      case ESort.Expensive:
        return { [`${variantsProp}.${priceProp}`]: 'desc' };
      case ESort.Popularity:
      default:
        return { [`${sortOrderProp}`]: 'desc' };
    }
  }

  getNormalizedFilters(): IFilter[] {
    if (!this.categoryId) {
      return super.getNormalizedFilters();
    }

    const categoryId = this.categoryId;
    delete this.categoryId;
    const filters = super.getNormalizedFilters();
    const categoriesProp: keyof AdminProductListItemDto = 'categories';
    const categoryIdProp: keyof AdminProductCategoryDto = 'id';
    return [...filters, { fieldName: `${categoriesProp}.${categoryIdProp}`, value: categoryId }];
  }
}
