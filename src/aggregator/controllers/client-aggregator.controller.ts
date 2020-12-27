import { ClassSerializerInterceptor, Controller, Get, Param, UseInterceptors, UsePipes, ValidationPipe } from '@nestjs/common';
import { AggregatorService } from '../services/aggregator.service';
import { ResponseDto } from '../../shared/dtos/shared-dtos/response.dto';
import { ClientAggregatedProductsTableDto } from '../../shared/dtos/client/aggregated-products-table.dto';
import { plainToClass } from 'class-transformer';
import { ClientLang } from '../../shared/decorators/lang.decorator';
import { Language } from '../../shared/enums/language.enum';

@UsePipes(new ValidationPipe({ transform: true }))
@UseInterceptors(ClassSerializerInterceptor)
@Controller('aggregators')
export class ClientAggregatorController {

  constructor(private readonly aggregatorService: AggregatorService) { }

  @Get(':id')
  async getAggregatedProducts(
    @Param('id') id: number,
    @ClientLang() lang: Language
  ): Promise<ResponseDto<ClientAggregatedProductsTableDto[]>> {
    const aggregatorTables = await this.aggregatorService.getClientAggregators(id, lang);

    return {
      data: plainToClass(ClientAggregatedProductsTableDto, aggregatorTables, { excludeExtraneousValues: true })
    };
  }
}
