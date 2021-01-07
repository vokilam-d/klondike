import { AdminProductReviewCommentDto } from '../admin/product-review.dto';
import { Exclude, Expose, plainToClass, Type } from 'class-transformer';
import { AdminBaseReviewDto } from '../admin/base-review.dto';
import { ClientMediaDto } from './media.dto';
import { Language } from '../../enums/language.enum';

export class ClientProductReviewCommentDto extends AdminProductReviewCommentDto {
  @Exclude()
  isEnabled: boolean;
}

export class ClientProductReviewDto extends AdminBaseReviewDto {
  @Expose()
  productId: number;

  @Expose()
  productName: string;

  @Expose()
  productVariantId: string;

  @Expose()
  @Type(() => ClientProductReviewCommentDto)
  comments: ClientProductReviewCommentDto[];

  @Expose()
  @Type(() => ClientMediaDto)
  medias: ClientMediaDto[];

  static transformToDto(review: AdminBaseReviewDto, lang: Language): ClientProductReviewDto {
    return {
      ...plainToClass(ClientProductReviewDto, review, { excludeExtraneousValues: true }),
      medias: ClientMediaDto.transformToDtosArray(review.medias, lang)
    }
  }
}
