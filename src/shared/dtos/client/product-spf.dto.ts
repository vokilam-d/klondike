import { ClientSortingPaginatingFilterDto } from './spf.dto';
import { IsOptional, IsString } from 'class-validator';
import { getPropertyOf } from '../../helpers/get-property-of.function';
import { Product } from '../../../product/models/product.model';

const defaultSortField = '-' + getPropertyOf<Product>('sortOrder');

export class ClientProductSortingPaginatingFilterDto extends ClientSortingPaginatingFilterDto {
  @IsString()
  @IsOptional()
  sort = defaultSortField;

  categoryId: string | number;
}
