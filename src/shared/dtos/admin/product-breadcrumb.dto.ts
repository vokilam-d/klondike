import { Expose } from 'class-transformer';
import { IsNumber, IsString } from 'class-validator';

export class ProductBreadcrumbDto {
  @Expose()
  @IsNumber()
  id: number;

  @Expose()
  @IsString()
  name: string;

  @Expose()
  @IsString()
  slug: string;
}
