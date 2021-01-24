import { Module } from '@nestjs/common';
import { ChartController } from './controllers/chart/chart.controller';
import { ChartService } from './services/chart.service';
import { OrderModule } from '../order/order.module';

@Module({
  controllers: [ChartController],
  providers: [ChartService],
  imports: [OrderModule]
})
export class ChartModule {}
