import { ClientSortingPaginatingFilterDto } from './spf.dto';
import { IsEnum, IsOptional } from 'class-validator';
import { getPropertyOf } from '../../helpers/get-property-of.function';
import { Product } from '../../../product/models/product.model';
import { ISorting } from '../shared/spf.dto';
import { AdminProductListItemDto } from '../admin/product-list-item.dto';
import { AdminProductVariantListItem } from '../admin/product-variant-list-item.dto';

const defaultSortField = '-' + getPropertyOf<Product>('sortOrder');

enum ESort {
  Popularity = 'popularity',
  Cheap = 'cheap',
  Expensive = 'expensive'
}

export class ClientProductSortingPaginatingFilterDto extends ClientSortingPaginatingFilterDto {
  @IsOptional()
  sort;

  categoryId: string | number;

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
}
