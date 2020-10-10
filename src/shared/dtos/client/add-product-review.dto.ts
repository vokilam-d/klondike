import { ClientProductReviewDto } from './product-review.dto';
import { ClientMediaDto } from './media.dto';
import { IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { TrimString } from '../../decorators/trim-string.decorator';

export class ClientAddProductReviewDto implements Pick<ClientProductReviewDto, 'productName' | 'productId' | 'productVariantId' | 'name' | 'text' | 'email' | 'rating'>{

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
}
