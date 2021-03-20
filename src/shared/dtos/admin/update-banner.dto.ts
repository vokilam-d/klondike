import { Expose } from 'class-transformer';
import { ValidateNested } from 'class-validator';
import { AdminCreateBannerItemDto } from './create-banner-item.dto';


export class AdminUpdateBannerDto {
  @Expose()
  @ValidateNested()
  bannerItems: AdminCreateBannerItemDto[];
}
