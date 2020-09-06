import { Expose, Type } from 'class-transformer';
import { ClientAggregatedProductDto } from './aggregated-product.dto';

export class ClientAggregatedProductsTableDto {
  @Expose()
  name: string;

  @Expose()
  @Type(() => ClientAggregatedProductDto)
  products: ClientAggregatedProductDto[];
}
