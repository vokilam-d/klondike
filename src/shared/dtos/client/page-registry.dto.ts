import { Expose } from 'class-transformer';
import { PageTypeEnum } from '../../enums/page-type.enum';

export class PageRegistryDto {
  @Expose()
  slug: string;

  @Expose()
  type: PageTypeEnum;
}
