import { Aggregator } from '../../../aggregator/models/aggregator.model';
import { Expose, Type } from 'class-transformer';
import { IsBoolean, IsNumber } from 'class-validator';
import { MultilingualTextDto } from '../shared-dtos/multilingual-text.dto';

export class AdminAggregatorDto implements Omit<Aggregator, '_id'> {
  @Expose()
  id: number;

  @Expose()
  @Type(() => MultilingualTextDto)
  name: MultilingualTextDto;

  @Expose()
  @Type(() => MultilingualTextDto)
  clientName: MultilingualTextDto;

  @Expose()
  @IsBoolean()
  isVisibleOnProductPage: boolean;

  @Expose()
  @IsNumber(undefined, { each: true })
  productIds: number[];
}
