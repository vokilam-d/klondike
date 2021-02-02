import { IsBoolean, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';

export class InvoiceEditDto {
  @IsOptional()
  title: string;

  @IsOptional()
  addressName: string;

  @IsOptional()
  addressPhone: string;

  @IsOptional()
  addressCity: string;

  @IsOptional()
  address: string;

  @IsOptional()
  addressBuildingNumber?: string;

  @IsOptional()
  addressFlatNumber?: string;

  @Transform(value => value === 'true')
  @IsBoolean()
  @IsOptional()
  hideStamp: boolean;

  @Transform(value => value === 'true')
  @IsBoolean()
  @IsOptional()
  withoutDiscounts: boolean;
}
