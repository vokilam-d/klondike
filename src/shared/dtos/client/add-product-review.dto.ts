import { ClientProductReviewDto } from './product-review.dto';
import { ClientMediaDto } from './media.dto';
import { IsNumber, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class ClientAddProductReviewDto implements Pick<ClientProductReviewDto, 'productName' | 'productId' | 'productVariantId' | 'name' | 'text' | 'email' | 'rating'>{

  @IsString()
  email: string;

  @IsString()
  name: string;

  @IsNumber()
  productId: number;

  @IsString()
  productName: string;

  @IsString()
  productVariantId: string;

  @IsNumber()
  rating: number;

  @IsString()
  text: string;

  @ValidateNested({ each: true })
  @Type(() => ClientMediaDto)
  medias: ClientMediaDto[];

  customerId?: number;
}

export class ClientAddProductReviewFromEmailDto implements Pick<ClientAddProductReviewDto, 'customerId' | 'productId' | 'productVariantId' | 'rating' | 'text'> {

  customerId?: number;

  @IsNumber()
  productId: number;

  @IsString()
  productVariantId: string;

  @IsNumber()
  rating: number;

  @IsString()
  text: string;
}
