import { Expose } from 'class-transformer';
import { IsString } from 'class-validator';

export class AdminProductSelectedAttributeDto {
  @Expose()
  @IsString()
  attributeId: string;

  @Expose()
  @IsString({ each: true })
  valueIds: string[];
}
