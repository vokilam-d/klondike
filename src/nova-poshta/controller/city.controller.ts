import {
    ClassSerializerInterceptor,
    Controller,
    Get,
    Query,
    UseInterceptors,
    UsePipes,
    ValidationPipe
} from '@nestjs/common';
import {NovaPoshtaService} from '../nova-poshta.service';
import {ResponseDto} from "../../shared/dtos/shared-dtos/response.dto";

@UsePipes(new ValidationPipe({ transform: true }))
@UseInterceptors(ClassSerializerInterceptor)
@Controller('cities')
export class CityController {

    constructor(private readonly novaPoshtaService: NovaPoshtaService) {
    }

    @Get()
    async getFiltered(@Query('filter') filter: string,
                      @Query('limit') limit = 5): Promise<ResponseDto<Array<string>>> {
        return {
            data: await this.novaPoshtaService.getCities(filter, limit)
        };
    }

}
