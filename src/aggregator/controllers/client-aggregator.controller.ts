import { ClassSerializerInterceptor, Controller, Get, Param, UseInterceptors, UsePipes, ValidationPipe } from '@nestjs/common';
import { AggregatorService } from '../services/aggregator.service';
import { ResponseDto } from '../../shared/dtos/shared-dtos/response.dto';
import { ClientAggregatedProductsTableDto } from '../../shared/dtos/client/aggregated-products-table.dto';
import { plainToClass } from 'class-transformer';

@UsePipes(new ValidationPipe({ transform: true }))
@UseInterceptors(ClassSerializerInterceptor)
@Controller('aggregators')
export class ClientAggregatorController {

  constructor(private readonly aggregatorService: AggregatorService) { }

  @Get(':id')
  async getAggregatedProducts(@Param('id') id: number): Promise<ResponseDto<ClientAggregatedProductsTableDto[]>> {
    const aggregatorTables = await this.aggregatorService.getClientAggregators(id);

    return {
      data: plainToClass(ClientAggregatedProductsTableDto, aggregatorTables, { excludeExtraneousValues: true })
    };
  }
}
