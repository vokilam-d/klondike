import { Expose, Transform, Type } from 'class-transformer';
import { IsBoolean, IsDate, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';
import { BaseReviewDto } from './base-review.dto';
import { prop } from '@typegoose/typegoose';

export class ProductReviewCommentDto {
  @Expose()
  @Transform(((value, obj) => value ? value : obj._id && obj._id.toString()))
  id: string;

  @Expose()
  @IsBoolean()
  isEnabled: boolean;

  @Expose()
  @IsString()
  name: string;

  @Expose()
  @IsString()
  text: string;

  @Expose()
  @IsOptional()
  @IsString()
  email: string;

  @Expose()
  @IsOptional()
  @IsNumber()
  customerId: number;

  @Expose()
  @IsDate()
  @Type(() => Date)
  createdAt: Date;
}

export class ProductReviewDto extends BaseReviewDto {
  @Expose()
  @IsNumber()
  productId: number;

  @Expose()
  @IsString()
  productName: string;

  @Expose()
  @IsOptional()
  @IsString()
  productVariantId: string;

  @Expose()
  @ValidateNested({ each: true })
  comments: ProductReviewCommentDto[];
}
