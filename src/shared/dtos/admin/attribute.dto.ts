import { Expose, Transform, Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsNotEmpty, IsOptional, IsString, ValidateNested } from 'class-validator';
import { AttributeTypeEnum } from '../../enums/attribute-type.enum';
import { transliterate } from '../../helpers/transliterate.function';

export class AdminAttributeValueDto {
  @Expose()
  @IsString()
  @Transform((id, value: AdminAttributeValueDto) => id === '' ? transliterate(value.label) : id)
  id: string;

  @Expose()
  @IsString()
  @IsNotEmpty()
  label: string;

  @Expose()
  @IsOptional()
  @IsBoolean()
  isDefault: boolean;
}

export class AdminUpdateAttributeDto {
  @Expose()
  @IsString()
  label: string;

  @Expose()
  @ValidateNested({ each: true })
  @Type(() => AdminAttributeValueDto)
  values: AdminAttributeValueDto[];

  @Expose()
  @IsString()
  groupName: string;
}

export class AdminCreateAttributeDto extends AdminUpdateAttributeDto {
  @Expose()
  @IsString()
  id: string;

  @Expose()
  @IsEnum(AttributeTypeEnum)
  type: AttributeTypeEnum;
}

export class AdminAttributeDto extends AdminCreateAttributeDto {
}
