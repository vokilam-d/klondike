import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Get,
  Post,
  UseInterceptors,
  Put,
  Param,
  Delete, UsePipes, ValidationPipe
} from '@nestjs/common';
import { AttributeService } from './attribute.service';
import {
  AdminAttributeDto,
  AdminCreateAttributeDto,
  AdminUpdateAttributeDto
} from '../shared/dtos/admin/attribute.dto';
import { plainToClass } from 'class-transformer';

@Controller('admin/attributes')
export class AdminAttributeController {

  constructor(private readonly attributeService: AttributeService) {
  }

  @UseInterceptors(ClassSerializerInterceptor)
  @Get()
  async getAttributes(): Promise<AdminAttributeDto[]> {
    const attributes = await this.attributeService.getAllAttributes();

    return plainToClass(AdminAttributeDto, attributes, { excludeExtraneousValues: true });
  }

  @UseInterceptors(ClassSerializerInterceptor)
  @Get(':id')
  async getAttribute(@Param('id') attributeId: string): Promise<AdminAttributeDto> {
    const attribute = await this.attributeService.getAttribute(attributeId);

    return plainToClass(AdminAttributeDto, attribute, { excludeExtraneousValues: true });
  }

  @UsePipes(new ValidationPipe({ transform: true }))
  @UseInterceptors(ClassSerializerInterceptor)
  @Post()
  async createAttribute(@Body() attributeDto: AdminCreateAttributeDto): Promise<AdminAttributeDto> {
    const created = await this.attributeService.createAttribute(attributeDto);

    return plainToClass(AdminAttributeDto, created, { excludeExtraneousValues: true });
  }

  @UsePipes(new ValidationPipe({ transform: true }))
  @UseInterceptors(ClassSerializerInterceptor)
  @Put(':id')
  async updateAttribute(@Param('id') attributeId: string, @Body() attributeDto: AdminUpdateAttributeDto): Promise<AdminAttributeDto> {
    const updated = await this.attributeService.updateAttribute(attributeId, attributeDto);

    return plainToClass(AdminAttributeDto, updated, { excludeExtraneousValues: true });
  }

  @UseInterceptors(ClassSerializerInterceptor)
  @Delete(':id')
  async deleteAttribute(@Param('id') attributeId: string): Promise<AdminAttributeDto> {
    const deleted = await this.attributeService.deleteAttribute(attributeId);

    return plainToClass(AdminAttributeDto, deleted, { excludeExtraneousValues: true });
  }
}
