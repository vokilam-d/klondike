import { Expose } from 'class-transformer';

export class ManagerDto {

  @Expose()
  userId?: string;

  @Expose()
  name?: string;

}
