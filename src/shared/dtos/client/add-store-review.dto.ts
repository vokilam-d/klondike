import { ClientStoreReviewDto } from './store-review.dto';
import { IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ClientMediaDto } from './media.dto';
import { TrimString } from '../../decorators/trim-string.decorator';
import { ReviewSource } from '../../enums/review-source.enum';
import { getValidReviewSource } from '../../helpers/get-valid-review-source.function';

export class ClientAddStoreReviewDto implements Pick<ClientStoreReviewDto, 'name' | 'text' | 'email' | 'rating' | 'source'> {
  @IsString()
  @TrimString()
  email: string;

  @IsString()
  @TrimString()
  name: string;

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

  @IsOptional()
  @Transform(getValidReviewSource)
  source: ReviewSource;
}

export class ClientAddStoreReviewFromEmailDto extends ClientAddStoreReviewDto {
  customerId: number;
}
