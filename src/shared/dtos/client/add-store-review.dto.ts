import { ClientStoreReviewDto } from './store-review.dto';
import { IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ClientMediaDto } from './media.dto';

export class ClientAddStoreReviewDto implements Pick<ClientStoreReviewDto, 'name' | 'text' | 'email' | 'rating'> {
  @IsString()
  email: string;

  @IsString()
  name: string;

  @IsNumber()
  rating: number;

  @IsString()
  text: string;

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => ClientMediaDto)
  medias: ClientMediaDto[] = [];
}
