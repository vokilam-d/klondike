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
import { CustomerService } from '../customer.service';
import { AdminSPFDto } from '../../shared/dtos/admin/spf.dto';
import { ResponseDto } from '../../shared/dtos/shared-dtos/response.dto';
import { plainToClass } from 'class-transformer';
import { AdminAddOrUpdateCustomerDto, AdminCustomerDto } from '../../shared/dtos/admin/customer.dto';
import { UserJwtGuard } from '../../auth/guards/user-jwt.guard';
import { AdminLang } from '../../shared/decorators/lang.decorator';
import { Language } from '../../shared/enums/language.enum';
import { CustomerReviewsAverageRatingDto } from '../../shared/dtos/admin/customer-reviews-average-rating.dto';

@UseGuards(UserJwtGuard)
@UsePipes(new ValidationPipe({ transform: true }))
@UseInterceptors(ClassSerializerInterceptor)
@Controller('admin/customers')
export class AdminCustomerController {

  constructor(private customerService: CustomerService) {
  }

  @Get()
  async getAllCustomers(@Query() sortingPaging: AdminSPFDto): Promise<ResponseDto<AdminCustomerDto[]>> {
    return this.customerService.getCustomersList(sortingPaging);
  }

  @Get(':id')
  async getCustomer(@Param('id') id: string, @AdminLang() lang: Language): Promise<ResponseDto<AdminCustomerDto>> {
    const customer = await this.customerService.getCustomerById(parseInt(id), lang);

    return {
      data: plainToClass(AdminCustomerDto, customer, { excludeExtraneousValues: true })
    };
  }

  @Get(':id/avg-reviews-rating')
  async getCustomerAverageReviewsRating(
    @Param('id') id: string,
    @AdminLang() lang: Language
  ): Promise<ResponseDto<CustomerReviewsAverageRatingDto>> {
    const avgRating = await this.customerService.getCustomerReviewsAverageRating(parseInt(id), lang);

    return {
      data: plainToClass(CustomerReviewsAverageRatingDto, avgRating, { excludeExtraneousValues: true })
    };
  }

  @Post()
  async addCustomer(
    @Body() customerDto: AdminAddOrUpdateCustomerDto,
    @AdminLang() lang: Language
  ): Promise<ResponseDto<AdminCustomerDto>> {
    const created = await this.customerService.adminCreateCustomer(customerDto, lang);

    return {
      data: plainToClass(AdminCustomerDto, created, { excludeExtraneousValues: true })
    };
  }

  @Put(':id')
  async updateCustomer(
    @Param('id') customerId: number,
    @Body() customerDto: AdminAddOrUpdateCustomerDto,
    @AdminLang() lang: Language
  ): Promise<ResponseDto<AdminCustomerDto>> {
    const updated = await this.customerService.updateCustomerById(customerId, customerDto, lang);

    return {
      data: plainToClass(AdminCustomerDto, updated, { excludeExtraneousValues: true })
    };
  }

  @Delete(':id')
  async deleteCustomer(
    @Param('id') customerId: number,
    @AdminLang() lang: Language
  ): Promise<ResponseDto<AdminCustomerDto>> {
    const deleted = await this.customerService.deleteCustomer(customerId, lang);

    return {
      data: plainToClass(AdminCustomerDto, deleted, { excludeExtraneousValues: true })
    };
  }
}
