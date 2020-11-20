import { Expose, Transform, Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsNotEmpty, IsOptional, IsString, ValidateNested } from 'class-validator';
import { AttributeTypeEnum } from '../../enums/attribute-type.enum';
import { transliterate } from '../../helpers/transliterate.function';
import { TrimString } from '../../decorators/trim-string.decorator';

export class AdminAttributeValueDto {
  @Expose()
  @IsString()
  @IsOptional()
  @TrimString()
  @Transform((id, value: AdminAttributeValueDto) => id === '' ? transliterate(value.label) : id)
  id: string;

  @Expose()
  @IsString()
  @IsNotEmpty()
  @TrimString()
  label: string;

  @Expose()
  @IsBoolean()
  isDefault: boolean;

  @Expose()
  @IsOptional()
  @IsString()
  color?: string;
}

export class AdminUpdateAttributeDto {
  @Expose()
  @IsString()
  @TrimString()
  label: string;

  @Expose()
  @ValidateNested({ each: true })
  @Type(() => AdminAttributeValueDto)
  values: AdminAttributeValueDto[];

  @Expose()
  @IsString()
  @TrimString()
  groupName: string;

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

export class AdminCreateAttributeDto extends AdminUpdateAttributeDto {
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
