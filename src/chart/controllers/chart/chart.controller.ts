import { Controller, Get, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { UserJwtGuard } from '../../../auth/guards/user-jwt.guard';
import { ChartService } from '../../services/chart.service';
import { ResponseDto } from '../../../shared/dtos/shared-dtos/response.dto';
import { OrderChartDataDto } from '../../../shared/dtos/admin/order-chart-data.dto';

@UseGuards(UserJwtGuard)
@UsePipes(new ValidationPipe({ transform: true }))
@Controller('admin/charts')
export class ChartController {

  constructor(
    private readonly chartService: ChartService
  ) { }

  @Get('orders')
  async getOrdersChart(): Promise<ResponseDto<OrderChartDataDto[]>> {
    const chartData = await this.chartService.getOrdersChart();

    return {
      data: chartData
    }
  }
}
