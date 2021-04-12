import { ManagerDto } from './manager.dto';
import { IsString } from 'class-validator';

export class UpdateOrderManager implements Pick<ManagerDto, 'userId'> {
  @IsString()
  userId: string;
}
