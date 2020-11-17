import { IsNumber } from 'class-validator';

export class UnfixProductOrderDto {
  @IsNumber()
  id: number;

  @IsNumber()
  categoryId: number;
}
