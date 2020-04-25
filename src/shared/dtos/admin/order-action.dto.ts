import { OrderActionEnum } from '../../enums/order-action.enum';
import { IsEnum, IsNumber } from 'class-validator';
import { Transform } from 'class-transformer';

export class OrderActionDto {
  @Transform(value => Number(value))
  @IsNumber()
  id: number;

  @IsEnum(OrderActionEnum)
  actionName: OrderActionEnum;
}
