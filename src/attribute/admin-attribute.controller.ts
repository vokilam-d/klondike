import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query, UseGuards,
  UseInterceptors,
  UsePipes,
  ValidationPipe
} from '@nestjs/common';
import { AttributeService } from './attribute.service';
import { AdminAttributeDto, AdminCreateAttributeDto, AdminUpdateAttributeDto } from '../shared/dtos/admin/attribute.dto';
import { plainToClass } from 'class-transformer';
import { ResponseDto } from '../shared/dtos/shared-dtos/response.dto';
import { AdminSPFDto } from '../shared/dtos/admin/spf.dto';
import { UserJwtGuard } from '../auth/guards/user-jwt.guard';

@UseGuards(UserJwtGuard)
@UsePipes(new ValidationPipe({ transform: true }))
@UseInterceptors(ClassSerializerInterceptor)
@Controller('admin/attributes')
export class AdminAttributeController {

  constructor(private readonly attributeService: AttributeService) {
  }


  @Get()
  async getAttributes(@Query() spf: AdminSPFDto): Promise<ResponseDto<AdminAttributeDto[]>> {
    return this.attributeService.getAttributesResponseDto(spf);
  }

  @Get(':id')
  async getAttribute(@Param('id') attributeId: string): Promise<ResponseDto<AdminAttributeDto>> {
    const attribute = await this.attributeService.getAttribute(attributeId);

    return {
      data: plainToClass(AdminAttributeDto, attribute, { excludeExtraneousValues: true })
    };
  }


  @Post()
  async createAttribute(@Body() attributeDto: AdminCreateAttributeDto): Promise<ResponseDto<AdminAttributeDto>> {
    const created = await this.attributeService.createAttribute(attributeDto);

    return {
      data: plainToClass(AdminAttributeDto, created, { excludeExtraneousValues: true })
    };
  }

  @Post('clear-collection') // todo remove this and all counter updates
  clearCollection() {
    return this.attributeService.clearCollection();
  }

  @Put(':id')
  async updateAttribute(@Param('id') attributeId: string,
                        @Body() attributeDto: AdminUpdateAttributeDto
  ): Promise<ResponseDto<AdminAttributeDto>> {
    const updated = await this.attributeService.updateAttribute(attributeId, attributeDto);

    return {
      data: plainToClass(AdminAttributeDto, updated, { excludeExtraneousValues: true })
    };
  }

  @Delete(':id')
  async deleteAttribute(@Param('id') attributeId: string): Promise<ResponseDto<AdminAttributeDto>> {
    const deleted = await this.attributeService.deleteAttribute(attributeId);

    return {
      data: plainToClass(AdminAttributeDto, deleted, { excludeExtraneousValues: true })
    };
  }
}
