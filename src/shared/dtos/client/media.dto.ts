import { BaseMediaDto } from '../shared-dtos/base-media.dto';
import { Expose } from 'class-transformer';

export class ClientMediaDto extends BaseMediaDto {
  @Expose()
  altText: string;
}
