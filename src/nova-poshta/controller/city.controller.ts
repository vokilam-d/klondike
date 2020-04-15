import {
  ClassSerializerInterceptor,
  Controller,
  Get,
  Put,
  Query,
  UseInterceptors,
  UsePipes,
  ValidationPipe
} from '@nestjs/common';
import { CityService } from '../city.service';
import { ResponseDto } from '../../shared/dtos/shared-dtos/response.dto';
import { ClientSPFDto } from '../../shared/dtos/client/spf.dto';

@UsePipes(new ValidationPipe({ transform: true }))
@UseInterceptors(ClassSerializerInterceptor)
@Controller('cities')
export class CityController {

  constructor(private readonly novaPoshtaService: CityService) {
  }

  @Put('catalog-migration')
  async loadCitiesToElastic() {
    this.novaPoshtaService.loadCitiesToElastic();
    return 'City catalog migration has been triggered.'
  }

  @Get()
  async getFiltered(@Query() spf: ClientSPFDto): Promise<ResponseDto<Array<any>>> {
    return await this.novaPoshtaService.getCities(spf);
  }

}
