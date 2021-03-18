import { Expose, Type } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { EBannerItemType } from '../../enums/banner-item-type.enum';
import { AdminMediaDto } from './media.dto';


export class AdminCreateBannerItemDto {
  @Expose()
  @IsNumber()
  @IsOptional()
  id?: number;

  @Expose()
  @IsEnum(EBannerItemType)
  type: EBannerItemType;

  @Expose()
  @IsString()
  @IsOptional()
  slug?: string;

  @Expose()
  @Type(() => AdminMediaDto)
  @IsOptional()
  media?: AdminMediaDto;
}
