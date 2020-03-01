import { EOrderAction } from '../../enums/order-action.enum';
import { IsEnum, IsNumber } from 'class-validator';
import { Transform } from 'class-transformer';

export class OrderActionDto {
  @Transform(value => Number(value))
  @IsNumber()
  id: number;

  @IsEnum(EOrderAction)
  actionName: EOrderAction;
}
