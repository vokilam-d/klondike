import { ClassSerializerInterceptor, Controller, Get, Param, UseInterceptors, UsePipes, ValidationPipe } from '@nestjs/common';
import { AdditionalServiceService } from '../services/additional-service.service';
import { ResponseDto } from '../../shared/dtos/shared-dtos/response.dto';
import { ClientAggregatedProductsTableDto } from '../../shared/dtos/client/aggregated-products-table.dto';
import { plainToClass } from 'class-transformer';

@UsePipes(new ValidationPipe({ transform: true }))
@UseInterceptors(ClassSerializerInterceptor)
@Controller('additionalServices')
export class ClientAdditionalServiceController {

  constructor(private readonly additionalServiceService: AdditionalServiceService) { }

  @Get(':id')
  async getAggregatedProducts(@Param('id') id: number): Promise<ResponseDto<ClientAggregatedProductsTableDto[]>> {
    const additionalServiceTables = await this.additionalServiceService.getClientAdditionalServices(id);

    return {
      data: plainToClass(ClientAggregatedProductsTableDto, additionalServiceTables, { excludeExtraneousValues: true })
    };
  }
}
