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
import { AdminAggregatorDto } from '../../shared/dtos/admin/aggregator.dto';
import { plainToClass } from 'class-transformer';
import { AggregatorService } from '../services/aggregator.service';

@UseGuards(UserJwtGuard)
@UsePipes(new ValidationPipe({ transform: true }))
@UseInterceptors(ClassSerializerInterceptor)
@Controller('admin/aggregators')
export class AdminAggregatorController {

  constructor(private readonly aggregatorService: AggregatorService) {}

  @Get()
  async getAggregators(@Query() spf: AdminSPFDto): Promise<ResponseDto<AdminAggregatorDto[]>> {
    return this.aggregatorService.getAggregatorsResponseDto(spf);
  }

  @Get(':id')
  async getAggregator(@Param('id') aggregatorId: string): Promise<ResponseDto<AdminAggregatorDto>> {
    const aggregator = await this.aggregatorService.getAggregator(aggregatorId);

    return {
      data: plainToClass(AdminAggregatorDto, aggregator, { excludeExtraneousValues: true })
    };
  }

  @Post()
  async createAggregator(@Body() aggregatorDto: AdminAggregatorDto): Promise<ResponseDto<AdminAggregatorDto>> {
    const created = await this.aggregatorService.createAggregator(aggregatorDto);

    return {
      data: plainToClass(AdminAggregatorDto, created, { excludeExtraneousValues: true })
    };
  }

  @Put(':id')
  async updateAggregator(
    @Param('id') aggregatorId: string,
    @Body() aggregatorDto: AdminAggregatorDto
  ): Promise<ResponseDto<AdminAggregatorDto>> {

    const updated = await this.aggregatorService.updateAggregator(aggregatorId, aggregatorDto);

    return {
      data: plainToClass(AdminAggregatorDto, updated, { excludeExtraneousValues: true })
    };
  }

  @Delete(':id')
  async deleteAggregator(@Param('id') aggregatorId: string): Promise<ResponseDto<AdminAggregatorDto>> {
    const deleted = await this.aggregatorService.deleteAggregator(aggregatorId);

    return {
      data: plainToClass(AdminAggregatorDto, deleted, { excludeExtraneousValues: true })
    };
  }

}
