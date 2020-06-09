import { Expose } from 'class-transformer';

export class StreetDto {

  @Expose()
  id: string;

  @Expose()
  name: string;

}
