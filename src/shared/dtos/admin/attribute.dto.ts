import { Expose, Type } from 'class-transformer';
import { IsBoolean, IsDefined, IsNotEmpty, IsString, Matches, ValidateNested } from 'class-validator';

export class AdminAttributeValue {
  @Expose()
  @IsBoolean()
  isDefault: boolean;

  @Expose()
  @IsString()
  @IsNotEmpty()
  name: string;
}

export class AdminUpdateAttributeDto {
  @Expose()
  @IsDefined()
  @IsNotEmpty()
  @IsString()
  label: string;

  @Expose()
  @ValidateNested({ each: true })
  @Type(() => AdminAttributeValue)
  values: AdminAttributeValue[];

  @Expose()
  @IsString()
  groupName: string;
}

export class AdminCreateAttributeDto extends AdminUpdateAttributeDto {
  @Expose()
  @IsDefined()
  @IsNotEmpty()
  @Matches(/[a-zA-Z0-9\-_]/g, { message: `Id must contain only alphanumeric, dashes or underscore` })
  id: string;
}

export class AdminAttributeDto extends AdminCreateAttributeDto {
}
