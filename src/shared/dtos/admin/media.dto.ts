import { IsBoolean, IsOptional, IsString } from 'class-validator';
import { Expose, Type } from 'class-transformer';
import { BaseMediaDto } from '../shared-dtos/base-media.dto';
import { TrimString } from '../../decorators/trim-string.decorator';
import { MultilingualTextDto } from '../shared-dtos/multilingual-text.dto';

export class AdminMediaDto extends BaseMediaDto {
  @Expose()
  @IsOptional()
  @IsBoolean()
  isHidden: boolean;

  @Expose()
  @IsOptional()
  @IsString()
  @TrimString()
  size: string;

  @Expose()
  @IsOptional()
  @IsString()
  @TrimString()
  dimensions: string;

  @Expose()
  @Type(() => MultilingualTextDto)
  altText: MultilingualTextDto;
}
