import { ClassSerializerInterceptor, Controller, Get, Query, UseInterceptors, UsePipes, ValidationPipe } from '@nestjs/common';
import { AdditionalServiceService } from '../services/additional-service.service';
import { ResponseDto } from '../../shared/dtos/shared-dtos/response.dto';
import { plainToClass } from 'class-transformer';
import { ClientAdditionalServiceDto } from '../../shared/dtos/client/additional-service.dto';
import { GetClientAdditionalServicesQueryDto } from '../../shared/dtos/client/get-client-additional-services-query.dto';

@UsePipes(new ValidationPipe({ transform: true }))
@UseInterceptors(ClassSerializerInterceptor)
@Controller('additional-services')
export class ClientAdditionalServiceController {

  constructor(private readonly additionalServiceService: AdditionalServiceService) { }

  @Get()
  async getAdditionalServices(@Query() queryDto: GetClientAdditionalServicesQueryDto): Promise<ResponseDto<ClientAdditionalServiceDto[]>> {
    const additionalServices = await this.additionalServiceService.getAdditionalServicesForClient(queryDto);

    return {
      data: plainToClass(ClientAdditionalServiceDto, additionalServices, { excludeExtraneousValues: true })
    };
  }
}
