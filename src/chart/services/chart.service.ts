import { Injectable } from '@nestjs/common';
import { OrderService } from '../../order/order.service';
import { OrderChartDataDto } from '../../shared/dtos/admin/order-chart-data.dto';

@Injectable()
export class ChartService {

  constructor(
    private readonly orderService: OrderService
  ) { }

  async getOrdersChart(): Promise<OrderChartDataDto[]> {
    const orders = await this.orderService.getOrdersForChart();

    const defaultData: { [date: string]: OrderChartDataDto } = {};

    const chartDataObj = orders.reduce((acc, order) => {
      const date = order.createdAt.toLocaleDateString('ru', { timeZone: 'Europe/Kiev' });
      if (!acc[date]) {
        const data = new OrderChartDataDto();
        data.date = date;
        acc[date] = data;
      }

      acc[date][order.source] += 1;

      return acc;
    }, defaultData);

    return Object.values(chartDataObj);
  }
}
