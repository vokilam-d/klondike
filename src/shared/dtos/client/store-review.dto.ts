import { Expose, plainToClass, Type } from 'class-transformer';
import { ClientMediaDto } from './media.dto';
import { AdminBaseReviewDto } from '../admin/base-review.dto';
import { Language } from '../../enums/language.enum';

export class ClientStoreReviewDto extends AdminBaseReviewDto {
  @Expose()
  @Type(() => ClientMediaDto)
  medias: ClientMediaDto[];

  static transformToDto(reviewDto: AdminBaseReviewDto, lang: Language): ClientStoreReviewDto {
    return {
      ...plainToClass(ClientStoreReviewDto, reviewDto, { excludeExtraneousValues: true }),
      medias: ClientMediaDto.transformToDtosArray(reviewDto.medias, lang)
    }
  }
}
