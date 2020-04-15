import { ClientProductReviewDto } from './product-review.dto';
import { ClientMediaDto } from './media.dto';
import { IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class ClientAddProductReviewDto implements Pick<ClientProductReviewDto, 'productName' | 'productId' | 'productVariantId' | 'name' | 'text' | 'email' | 'rating'>{

  @IsString()
  email: string;

  @IsString()
  name: string;

  @IsNumber()
  @Transform(Number)
  productId: number;

  @IsString()
  productName: string;

  @IsString()
  productVariantId: string;

  @IsNumber()
  @Transform(Number)
  rating: number;

  @IsString()
  text: string;

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => ClientMediaDto)
  medias: ClientMediaDto[] = [];

  @Transform(Number)
  customerId?: number;
}
