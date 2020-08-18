import { LinkedProduct } from '../../../product/models/linked-product.model';
import { Expose } from 'class-transformer';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class AdminLinkedProductDto implements Record<keyof LinkedProduct, any> {
  @Expose()
  @IsNumber()
  productId: number;

  @Expose()
  @IsString()
  variantId: string;

  @Expose()
  @IsOptional()
  @IsNumber()
  sortOrder: number;
}
