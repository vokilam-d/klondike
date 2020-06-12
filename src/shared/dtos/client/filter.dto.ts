import { Expose } from 'class-transformer';
import { Attribute, AttributeValue } from '../../../attribute/models/attribute.model';

export class ClientFilterValueDto implements Pick<AttributeValue, 'label'>, Record<keyof Pick<AttributeValue, 'id'>, any> {
  @Expose()
  id: string | number;

  @Expose()
  label: string;

  @Expose()
  productsCount?: number;

  @Expose()
  isDisabled: boolean;

  @Expose()
  isSelected: boolean;
}

class Range {
  min: number;
  max: number;
}

export class ClientFilterRangeValuesDto {
  range: Range;
  selected: Range;
}

export class ClientFilterDto implements Pick<Attribute, 'id' | 'label'>, Partial<Record<keyof Pick<Attribute, 'values'>, any>> {
  @Expose()
  id: string;

  @Expose()
  label: string;

  @Expose()
  type: 'checkbox' | 'range';

  @Expose()
  isDisabled: boolean;

  @Expose()
  values?: ClientFilterValueDto[];

  @Expose()
  rangeValues?: ClientFilterRangeValuesDto;
}
