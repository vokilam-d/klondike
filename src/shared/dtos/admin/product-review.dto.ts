import { Expose, Transform, Type } from 'class-transformer';
import { IsArray, IsBoolean, IsDate, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';
import { AdminBaseReviewDto } from './base-review.dto';
import { TrimString } from '../../decorators/trim-string.decorator';
import { AdminMediaDto } from './media.dto';

export class AdminProductReviewCommentDto {
  @Expose()
  @Transform(((value, obj) => obj._id || value))
  id: string;

  @Expose()
  @IsBoolean()
  isEnabled: boolean;

  @Expose()
  @IsString()
  @TrimString()
  name: string;

  @Expose()
  @IsString()
  @TrimString()
  text: string;

  @Expose()
  @IsOptional()
  @IsString()
  @TrimString()
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

export class AdminProductReviewDto extends AdminBaseReviewDto {
  @Expose()
  @IsNumber()
  productId: number;

  @Expose()
  @IsString()
  @TrimString()
  productName: string;

  @Expose()
  @IsOptional()
  @IsString()
  @TrimString()
  productVariantId: string;

  @Expose()
  @ValidateNested({ each: true })
  @Type(() => AdminProductReviewCommentDto)
  comments?: AdminProductReviewCommentDto[];

  @Expose()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AdminMediaDto)
  medias: AdminMediaDto[];
}
