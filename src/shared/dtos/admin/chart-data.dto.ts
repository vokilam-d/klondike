import { Expose } from 'class-transformer';

export class ChartDataDto {
  @Expose()
  date: string;
}
