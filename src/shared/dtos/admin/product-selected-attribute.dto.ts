import { Expose } from 'class-transformer';
import { IsString } from 'class-validator';
import { TrimString } from '../../decorators/trim-string.decorator';

export class AdminProductSelectedAttributeDto {
  @Expose()
  @IsString()
  @TrimString()
  attributeId: string;

  @Expose()
  @IsString({ each: true })
  @TrimString()
  valueIds: string[];
}
