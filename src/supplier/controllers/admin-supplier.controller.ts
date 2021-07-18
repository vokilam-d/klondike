import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { UserJwtGuard } from '../../auth/guards/user-jwt.guard';
import { SupplierService } from '../services/supplier.service';
import { ResponseDto } from '../../shared/dtos/shared-dtos/response.dto';
import { AdminSupplierDto } from '../../shared/dtos/admin/supplier.dto';
import { plainToClass } from 'class-transformer';
import { AdminSPFDto } from '../../shared/dtos/admin/spf.dto';
import { AdminLang } from '../../shared/decorators/lang.decorator';
import { Language } from '../../shared/enums/language.enum';


@UseGuards(UserJwtGuard)
@UsePipes(new ValidationPipe({ transform: true }))
@Controller('admin/supplier')
export class AdminSupplierController {

  constructor(
    private readonly supplierService: SupplierService
  ) { }

  @Get()
  async getSuppliers(@Query() spf: AdminSPFDto): Promise<ResponseDto<AdminSupplierDto[]>> {
    return this.supplierService.getSuppliersResponseDto(spf);
  }

  @Get(':id')
  async getSupplier(
    @Param('id') id: string,
    @AdminLang() lang: Language
  ): Promise<ResponseDto<AdminSupplierDto>> {
    const supplier = await this.supplierService.getSupplierById(parseInt(id), lang);

    return {
      data: plainToClass(AdminSupplierDto, supplier, { excludeExtraneousValues: true })
    };
  }

  @Post()
  async createSupplier(
    @Body() supplierDto: AdminSupplierDto
  ): Promise<ResponseDto<AdminSupplierDto>> {
    const created = await this.supplierService.createSupplier(supplierDto);

    return {
      data: plainToClass(AdminSupplierDto, created, { excludeExtraneousValues: true })
    };
  }

  @Put(':id')
  async updateSupplier(
    @Param('id') id: string,
    @Body() supplierDto: AdminSupplierDto,
    @AdminLang() lang: Language
  ): Promise<ResponseDto<AdminSupplierDto>> {
    const updated = await this.supplierService.updateSupplier(parseInt(id), supplierDto, lang);

    return {
      data: plainToClass(AdminSupplierDto, updated, { excludeExtraneousValues: true })
    };
  }

  @Delete(':id')
  async deleteSupplier(
    @Param('id') id: string,
    @AdminLang() lang: Language
  ): Promise<ResponseDto<AdminSupplierDto>> {
    const deleted = await this.supplierService.deleteSupplier(parseInt(id), lang);

    return {
      data: plainToClass(AdminSupplierDto, deleted, { excludeExtraneousValues: true })
    };
  }
}
