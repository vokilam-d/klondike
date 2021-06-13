import { AdminMediaDto } from './media.dto';
import { ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class AdminDuplicateMediasDto {
  @ValidateNested({ each: true })
  @Type(() => AdminMediaDto)
  medias: AdminMediaDto[];
}
