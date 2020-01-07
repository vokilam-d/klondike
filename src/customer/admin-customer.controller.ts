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
import { AdminSortingPaginatingDto } from '../shared/dtos/admin/filter.dto';
import { ResponsePaginationDto } from '../shared/dtos/admin/response.dto';
import { plainToClass } from 'class-transformer';
import { AdminAddOrUpdateCustomerDto, AdminCustomerDto } from '../shared/dtos/admin/customer.dto';



@UsePipes(new ValidationPipe({ transform: true }))
@UseInterceptors(ClassSerializerInterceptor)
@Controller('admin/customers')
export class AdminCustomerController {

  constructor(private customerService: CustomerService) {
  }

  @Get()
  async getAllCustomers(@Query() sortingPaging: AdminSortingPaginatingDto): Promise<ResponsePaginationDto<AdminCustomerDto[]>> {
    const [ results, itemsTotal ] = await Promise.all([this.customerService.getAllCustomers(sortingPaging), this.customerService.countCustomers()]);
    const pagesTotal = Math.ceil(itemsTotal / sortingPaging.limit);

    return {
      data: plainToClass(AdminCustomerDto, results, { excludeExtraneousValues: true }),
      page: sortingPaging.page,
      pagesTotal,
      itemsTotal
    };
  }

  @Get(':id')
  async getCustomer(@Param('id') id: string): Promise<AdminCustomerDto> {
    const customer = await this.customerService.getCustomerById(parseInt(id));

    return plainToClass(AdminCustomerDto, customer, { excludeExtraneousValues: true });
  }

  @Post()
  async addCustomer(@Body() customerDto: AdminAddOrUpdateCustomerDto): Promise<AdminCustomerDto> {
    const created = await this.customerService.createCustomer(customerDto);

    return plainToClass(AdminCustomerDto, created, { excludeExtraneousValues: true });
  }

  @Put(':id')
  async updateCustomer(@Param('id') customerId: number, @Body() customerDto: AdminAddOrUpdateCustomerDto): Promise<AdminCustomerDto> {
    const updated = await this.customerService.updateCustomer(customerId, customerDto);

    return plainToClass(AdminCustomerDto, updated, { excludeExtraneousValues: true });
  }

  @Delete(':id')
  async deleteCustomer(@Param('id') customerId: number): Promise<AdminCustomerDto> {
    const deleted = await this.customerService.deleteCustomer(customerId);

    return plainToClass(AdminCustomerDto, deleted, { excludeExtraneousValues: true });
  }
}
