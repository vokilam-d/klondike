import { Expose } from 'class-transformer';
import { Manager } from '../../../order/models/manager.model';

export class ManagerDto implements Manager {

  @Expose()
  userId: string;

  @Expose()
  name: string;

}
