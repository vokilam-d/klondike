import { ChartDataDto } from './chart-data.dto';
import { Expose } from 'class-transformer';

export class OrderChartDataDto extends ChartDataDto {
  @Expose()
  client: number = 0;

  @Expose()
  manager: number = 0;
}
