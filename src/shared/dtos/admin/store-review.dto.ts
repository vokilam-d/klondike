import { AdminBaseReviewDto } from './base-review.dto';
import { Expose, Type } from 'class-transformer';
import { IsArray, ValidateNested } from 'class-validator';
import { AdminMediaDto } from './media.dto';

export class AdminStoreReviewDto extends AdminBaseReviewDto {
  @Expose()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AdminMediaDto)
  medias: AdminMediaDto[];
}
