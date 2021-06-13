import { Exclude, Expose, Type } from 'class-transformer';
import { ClientAggregatedProductDto } from './aggregated-product.dto';
import { Aggregator } from '../../../aggregator/models/aggregator.model';

export class ClientAggregatedProductsTableDto implements Pick<Aggregator, 'isInPriority'> {
  @Expose()
  name: string;

  @Exclude()
  isInPriority: boolean;

  @Expose()
  @Type(() => ClientAggregatedProductDto)
  products: ClientAggregatedProductDto[];
}
