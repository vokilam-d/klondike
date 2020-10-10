import { ClientStoreReviewDto } from './store-review.dto';
import { IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ClientMediaDto } from './media.dto';
import { TrimString } from '../../decorators/trim-string.decorator';

export class ClientAddStoreReviewDto implements Pick<ClientStoreReviewDto, 'name' | 'text' | 'email' | 'rating'> {
  @IsString()
  @TrimString()
  email: string;

  @IsString()
  @TrimString()
  name: string;

  @IsNumber()
  rating: number;

  @IsString()
  @TrimString()
  text: string;

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => ClientMediaDto)
  medias: ClientMediaDto[] = [];
}
