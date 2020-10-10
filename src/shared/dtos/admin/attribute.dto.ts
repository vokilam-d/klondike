import { Expose, Transform, Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsNotEmpty, IsOptional, IsString, ValidateNested } from 'class-validator';
import { AttributeTypeEnum } from '../../enums/attribute-type.enum';
import { transliterate } from '../../helpers/transliterate.function';
import { TrimString } from '../../decorators/trim-string.decorator';

export class AdminAttributeValueDto {
  @Expose()
  @IsString()
  @IsOptional()
  @Transform((id, value: AdminAttributeValueDto) => id === '' ? transliterate(value.label) : id)
  @TrimString()
  id: string;

  @Expose()
  @IsString()
  @IsNotEmpty()
  @TrimString()
  label: string;

  @Expose()
  @IsOptional()
  @IsBoolean()
  isDefault: boolean;
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
  @IsOptional()
  @IsBoolean()
  isVisibleInProduct: boolean;

  @Expose()
  @IsOptional()
  @IsBoolean()
  isVisibleInFilters: boolean;
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
