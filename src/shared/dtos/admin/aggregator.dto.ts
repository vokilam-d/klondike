import { Aggregator } from '../../../aggregator/models/aggregator.model';
import { Expose } from 'class-transformer';
import { IsBoolean, IsNumber, IsString } from 'class-validator';

export class AdminAggregatorDto implements Pick<Aggregator, 'id' | 'isVisibleOnProductPage' | 'productIds'> {
  @Expose()
  id: number;

  @Expose()
  @IsString()
  name: string;

  @Expose()
  @IsBoolean()
  isVisibleOnProductPage: boolean;

  @Expose()
  @IsNumber(undefined, { each: true })
  productIds: number[];
}
