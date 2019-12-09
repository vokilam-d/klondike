import { Expose, Type } from 'class-transformer';
import { IsBoolean, IsDefined, IsNotEmpty, IsString, Matches, ValidateNested } from 'class-validator';
import { urlFriendlyCodeRegex } from '../../contants';

export class AdminAttributeValueDto {
  @Expose()
  @Matches(urlFriendlyCodeRegex, { message: `Attribute id must contain only alphanumeric, dashes or underscore` })
  id: string;

  @Expose()
  @IsString()
  @IsNotEmpty()
  name: string;

  @Expose()
  @IsBoolean()
  isDefault: boolean;
}

export class AdminUpdateAttributeDto {
  @Expose()
  @IsDefined()
  @IsNotEmpty()
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
  @Matches(urlFriendlyCodeRegex, { message: `Attribute id must contain only alphanumeric, dashes or underscore` })
  id: string;
}

export class AdminAttributeDto extends AdminCreateAttributeDto {
}
