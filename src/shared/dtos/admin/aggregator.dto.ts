import { Aggregator } from '../../../aggregator/models/aggregator.model';
import { Expose } from 'class-transformer';
import { IsBoolean, IsNumber, IsString } from 'class-validator';
import { TrimString } from '../../decorators/trim-string.decorator';

export class AdminAggregatorDto implements Pick<Aggregator, 'id' | 'isVisibleOnProductPage' | 'productIds'> {
  @Expose()
  id: number;

  @Expose()
  @IsString()
  @TrimString()
  name: string;

  @Expose()
  @IsString()
  @TrimString()
  clientName: string;

  @Expose()
  @IsBoolean()
  isVisibleOnProductPage: boolean;

  @Expose()
  @IsNumber(undefined, { each: true })
  productIds: number[];
}
