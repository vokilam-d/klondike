import { Expose, Type } from 'class-transformer';
import { IsBoolean, IsNotEmpty, IsOptional, IsString, ValidateNested } from 'class-validator';

export class AdminAttributeValueDto {
  @Expose()
  @IsString()
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
}

export class AdminAttributeDto extends AdminCreateAttributeDto {
}
