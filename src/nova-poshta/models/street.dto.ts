import { Expose } from 'class-transformer';
import { IsString } from 'class-validator';

export class StreetDto {

  @Expose()
  @IsString()
  id: string;

  @Expose()
  @IsString()
  name: string;

}
