import { ClientProductReviewDto } from './product-review.dto';
import { ClientMediaDto } from './media.dto';
import { IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { TrimString } from '../../decorators/trim-string.decorator';
import { ReviewSource } from '../../enums/review-source.enum';
import { getValidReviewSource } from '../../helpers/get-valid-review-source.function';

export class ClientAddProductReviewDto implements Pick<ClientProductReviewDto, 'productName' | 'productId' | 'productVariantId' | 'name' | 'text' | 'email' | 'rating' | 'source'>{

  @IsString()
  @TrimString()
  email: string;

  @IsString()
  @TrimString()
  name: string;

  @IsNumber()
  @Transform(Number)
  productId: number;

  @IsString()
  @TrimString()
  productName: string;

  @IsString()
  @TrimString()
  productVariantId: string;

  @IsNumber()
  @Transform(Number)
  rating: number;

  @IsString()
  @TrimString()
  text: string;

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => ClientMediaDto)
  medias: ClientMediaDto[] = [];

  @Transform(Number)
  customerId?: number;

  @IsOptional()
  @Transform(getValidReviewSource)
  source: ReviewSource;
}
