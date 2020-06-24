import { IsEnum, IsNumber } from 'class-validator';
import { Transform } from 'class-transformer';
import { OrderStatusEnum } from '../../enums/order-status.enum';

export class ChangeOrderStatusDto {
  @Transform(value => Number(value))
  @IsNumber()
  id: number;

  @IsEnum(OrderStatusEnum)
  status: OrderStatusEnum;
}
