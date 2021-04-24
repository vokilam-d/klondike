import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
  UseInterceptors,
  UsePipes,
  ValidationPipe
} from '@nestjs/common';
import { UserJwtGuard } from '../../auth/guards/user-jwt.guard';
import { AdminSPFDto } from '../../shared/dtos/admin/spf.dto';
import { ResponseDto } from '../../shared/dtos/shared-dtos/response.dto';
import { AdminAdditionalServiceDto } from '../../shared/dtos/admin/additional-service.dto';
import { plainToClass } from 'class-transformer';
import { AdditionalServiceService } from '../services/additional-service.service';
import { BaseShipmentDto } from '../../shared/dtos/shared-dtos/base-shipment.dto';
import { AdminLang } from '../../shared/decorators/lang.decorator';
import { Language } from '../../shared/enums/language.enum';

@UseGuards(UserJwtGuard)
@UsePipes(new ValidationPipe({ transform: true }))
@UseInterceptors(ClassSerializerInterceptor)
@Controller('admin/additional-services')
export class AdminAdditionalServiceController {

  constructor(private readonly additionalServiceService: AdditionalServiceService) {}

  @Get()
  async getAdditionalServices(@Query() spf: AdminSPFDto): Promise<ResponseDto<AdminAdditionalServiceDto[]>> {
    return this.additionalServiceService.getAdditionalServicesResponseDto(spf);
  }

  @Get(':id')
  async getAdditionalService(
    @Param('id') additionalServiceId: string,
    @AdminLang() lang: Language
  ): Promise<ResponseDto<AdminAdditionalServiceDto>> {
    const additionalService = await this.additionalServiceService.getAdditionalServiceById(parseInt(additionalServiceId), lang);

    return {
      data: plainToClass(AdminAdditionalServiceDto, additionalService, { excludeExtraneousValues: true })
    };
  }


  @Post()
  async createAdditionalService(
    @Body() additionalServiceDto: AdminAdditionalServiceDto,
    @AdminLang() lang: Language
  ): Promise<ResponseDto<AdminAdditionalServiceDto>> {
    const created = await this.additionalServiceService.createAdditionalService(additionalServiceDto, lang);

    return {
      data: plainToClass(AdminAdditionalServiceDto, created, { excludeExtraneousValues: true })
    };
  }

  @Put(':id')
  async updateAdditionalService(
    @Param('id') additionalServiceId: string,
    @Body() additionalServiceDto: AdminAdditionalServiceDto,
    @AdminLang() lang: Language
  ): Promise<ResponseDto<AdminAdditionalServiceDto>> {

    const updated = await this.additionalServiceService.updateAdditionalService(additionalServiceId, additionalServiceDto, lang);

    return {
      data: plainToClass(AdminAdditionalServiceDto, updated, { excludeExtraneousValues: true })
    };
  }

  @Delete(':id')
  async deleteAdditionalService(
    @Param('id') additionalServiceId: string,
    @AdminLang() lang: Language
  ): Promise<ResponseDto<AdminAdditionalServiceDto>> {
    const deleted = await this.additionalServiceService.deleteAdditionalService(additionalServiceId, lang);

    return {
      data: plainToClass(AdminAdditionalServiceDto, deleted, { excludeExtraneousValues: true })
    };
  }

}
