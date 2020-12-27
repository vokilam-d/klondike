import { Expose, Transform, Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsOptional, IsString, ValidateNested } from 'class-validator';
import { AttributeTypeEnum } from '../../enums/attribute-type.enum';
import { transliterate } from '../../helpers/transliterate.function';
import { TrimString } from '../../decorators/trim-string.decorator';
import { Attribute, AttributeValue } from '../../../attribute/models/attribute.model';
import { MultilingualTextDto } from '../shared-dtos/multilingual-text.dto';
import { clientDefaultLanguage } from '../../constants';

export class AdminAttributeValueDto implements AttributeValue {
  @Expose()
  @IsString()
  @IsOptional()
  @TrimString()
  @Transform((id, value: AdminAttributeValueDto) => id === '' ? transliterate(value.label[clientDefaultLanguage]) : id)
  id: string;

  @Expose()
  @Type(() => MultilingualTextDto)
  label: MultilingualTextDto;

  @Expose()
  @IsBoolean()
  isDefault: boolean;

  @Expose()
  @IsOptional()
  @IsString()
  color?: string;
}

export class AdminUpdateAttributeDto implements Omit<Attribute, '_id' | 'id' | 'type'> {
  @Expose()
  @Type(() => MultilingualTextDto)
  label: MultilingualTextDto;

  @Expose()
  @ValidateNested({ each: true })
  @Type(() => AdminAttributeValueDto)
  values: AdminAttributeValueDto[];

  @Expose()
  @IsBoolean()
  isVisibleInProduct: boolean;

  @Expose()
  @IsBoolean()
  isVisibleInFilters: boolean;

  @Expose()
  @IsBoolean()
  hasColor: boolean;
}

export class AdminCreateAttributeDto extends AdminUpdateAttributeDto implements Omit<Attribute, '_id'> {
  @Expose()
  @IsString()
  @TrimString()
  id: string;

  @Expose()
  @IsEnum(AttributeTypeEnum)
  type: AttributeTypeEnum;
}

export class AdminAttributeDto extends AdminCreateAttributeDto {
}
