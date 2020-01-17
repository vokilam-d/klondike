import { Expose, Type } from 'class-transformer';
import { IsBoolean, IsNotEmpty, IsString, Matches, ValidateNested } from 'class-validator';
import { alphaNumDashUnderscoreRegex } from '../../constants';

export class AdminAttributeValueDto {
  @Expose()
  @Matches(alphaNumDashUnderscoreRegex, { message: `Attribute id must contain only alphanumeric, dashes or underscore` })
  id: string;

  @Expose()
  @IsString()
  @IsNotEmpty()
  label: string;

  @Expose()
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
  @Matches(alphaNumDashUnderscoreRegex, { message: `Attribute id must contain only alphanumeric, dashes or underscore` })
  id: string;
}

export class AdminAttributeDto extends AdminCreateAttributeDto {
}
