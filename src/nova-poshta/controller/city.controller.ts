import {
  ClassSerializerInterceptor,
  Controller,
  Get,
  Post,
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

  @Post('action/update-catalog')
  async loadCitiesToElastic() {
    this.novaPoshtaService.loadCitiesToElastic();
    return 'City catalog migration has been triggered.';
  }

  @Get()
  async getFiltered(@Query() spf: ClientSPFDto): Promise<ResponseDto<any[]>> {
    return {
      data: await this.novaPoshtaService.getCities(spf)
    };
  }
}
