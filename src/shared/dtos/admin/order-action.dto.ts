import { EOrderAction } from '../../enums/order-action.enum';
import { IsEnum, IsNumberString } from 'class-validator';

export class OrderActionDto {
  @IsNumberString()
  id: number;

  @IsEnum(EOrderAction)
  actionName: EOrderAction;
}
