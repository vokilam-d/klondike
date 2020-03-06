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
  UseInterceptors,
  UsePipes,
  ValidationPipe
} from '@nestjs/common';
import { CustomerService } from './customer.service';
import { AdminSortingPaginatingFilterDto } from '../shared/dtos/admin/spf.dto';
import { ResponseDto } from '../shared/dtos/shared/response.dto';
import { plainToClass } from 'class-transformer';
import { AdminAddOrUpdateCustomerDto, AdminCustomerDto } from '../shared/dtos/admin/customer.dto';

@UsePipes(new ValidationPipe({ transform: true }))
@UseInterceptors(ClassSerializerInterceptor)
@Controller('admin/customers')
export class AdminCustomerController {

  constructor(private customerService: CustomerService) {
  }

  @Get()
  async getAllCustomers(@Query() sortingPaging: AdminSortingPaginatingFilterDto): Promise<ResponseDto<AdminCustomerDto[]>> {
    return this.customerService.getCustomersList(sortingPaging);
  }

  @Get(':id')
  async getCustomer(@Param('id') id: string): Promise<ResponseDto<AdminCustomerDto>> {
    const customer = await this.customerService.getCustomerById(parseInt(id));

    return {
      data: plainToClass(AdminCustomerDto, customer, { excludeExtraneousValues: true })
    };
  }

  @Post()
  async addCustomer(@Body() customerDto: AdminAddOrUpdateCustomerDto, @Query('migrate') migrate: any): Promise<ResponseDto<AdminCustomerDto>> {
    const created = await this.customerService.createCustomer(customerDto, undefined, migrate);

    return {
      data: plainToClass(AdminCustomerDto, created, { excludeExtraneousValues: true })
    };
  }

  @Put(':id')
  async updateCustomer(@Param('id') customerId: number, @Body() customerDto: AdminAddOrUpdateCustomerDto): Promise<ResponseDto<AdminCustomerDto>> {
    const updated = await this.customerService.updateCustomer(customerId, customerDto);

    return {
      data: plainToClass(AdminCustomerDto, updated, { excludeExtraneousValues: true })
    };
  }

  @Delete(':id')
  async deleteCustomer(@Param('id') customerId: number): Promise<ResponseDto<AdminCustomerDto>> {
    const deleted = await this.customerService.deleteCustomer(customerId);

    return {
      data: plainToClass(AdminCustomerDto, deleted, { excludeExtraneousValues: true })
    };
  }

  @Post('counter') // todo remove this and all counter updates
  updateCounter() {
    return this.customerService.updateCounter();
  }
}
