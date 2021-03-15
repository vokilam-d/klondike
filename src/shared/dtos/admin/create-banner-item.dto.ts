import { Expose } from 'class-transformer';
import { IsEnum, IsNumber } from 'class-validator';
import { EBannerItemType } from '../../enums/banner-item-type.enum';


export class AdminCreateBannerItemDto {
  @Expose()
  @IsNumber()
  id: number;

  @Expose()
  @IsEnum(EBannerItemType)
  type: EBannerItemType;
}