import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Req,
  Res,
  UseGuards,
  UseInterceptors,
  UsePipes,
  ValidationPipe
} from '@nestjs/common';
import { CustomerService } from '../customer.service';
import { ClientRegisterDto } from '../../shared/dtos/client/register.dto';
import { FastifyReply } from 'fastify';
import { ServerResponse } from 'http';
import { LoginDto } from '../../shared/dtos/shared-dtos/login.dto';
import { Customer } from '../models/customer.model';
import { plainToClass } from 'class-transformer';
import { ClientCustomerDto } from '../../shared/dtos/client/customer.dto';
import { AuthService } from '../../auth/services/auth.service';
import { ResponseDto } from '../../shared/dtos/shared-dtos/response.dto';
import { ClientUpdateCustomerDto } from '../../shared/dtos/client/update-customer.dto';
import { DocumentType } from '@typegoose/typegoose';
import { ClientUpdatePasswordDto } from '../../shared/dtos/client/update-password.dto';
import { CustomerJwtGuard } from '../../auth/guards/customer-jwt.guard';
import { CustomerLocalGuard } from '../../auth/guards/customer-local.guard';
import { InitResetPasswordDto } from '../../shared/dtos/client/init-reset-password.dto';
import { ResetPasswordDto } from '../../shared/dtos/client/reset-password.dto';
import { OrderService } from '../../order/order.service';
import { OrderFilterDto } from '../../shared/dtos/admin/order-filter.dto';
import { ClientOrderDto } from '../../shared/dtos/client/order.dto';
import { ShipmentAddressDto } from '../../shared/dtos/shared-dtos/shipment-address.dto';

@UsePipes(new ValidationPipe({ transform: true }))
@UseInterceptors(ClassSerializerInterceptor)
@Controller('customer')
export class ClientCustomerController {

  constructor(private customerService: CustomerService,
              private orderService: OrderService,
              private authService: AuthService) {
  }

  @Get()
  async getInfo(@Req() req): Promise<ResponseDto<ClientCustomerDto | null>> {
    const customer: Customer = await this.authService.getCustomerFromReq(req);
    const dto = customer ? plainToClass(ClientCustomerDto, customer, { excludeExtraneousValues: true }) : null;

    return {
      data: dto
    };
  }

  @Get('google/callback')
  googleLoginCallback(@Req() req, @Res() res: FastifyReply<ServerResponse>) {
    return this.authService.callbackOAuthGoogle(req, res);
  }

  @Get('facebook/callback')
  facebookLoginCallback(@Req() req, @Res() res: FastifyReply<ServerResponse>) {
    return this.authService.callbackOAuthFacebook(req, res);
  }

  @UseGuards(CustomerJwtGuard)
  @Get('details')
  async getAccount(@Req() req): Promise<ResponseDto<ClientCustomerDto>> {
    const customer: DocumentType<Customer> = req.user;

    return {
      data: plainToClass(ClientCustomerDto, customer, { excludeExtraneousValues: true })
    };
  }

  @UseGuards(CustomerJwtGuard)
  @Get('order')
  async getOrders(@Req() req): Promise<ResponseDto<ClientOrderDto[]>> {
    const customer: DocumentType<Customer> = req.user;

    const orderFilterDto = new OrderFilterDto();
    orderFilterDto.customerId = customer.id;
    orderFilterDto.limit = 100;
    const { data: orders } = await this.orderService.getOrdersList(orderFilterDto);

    return {
      data: plainToClass(ClientOrderDto, orders, { excludeExtraneousValues: true })
    };
  }

  /**
   * @returns ResponseDto<ClientCustomerDto>
   */
  @UseGuards(CustomerJwtGuard)
  @Post('password')
  async updatePassword(@Req() req, @Body() dto: ClientUpdatePasswordDto, @Res() res: FastifyReply<ServerResponse>) {
    const customer: DocumentType<Customer> = req.user;
    const updated = await this.customerService.checkAndUpdatePassword(customer, dto);
    const customerDto = plainToClass(ClientCustomerDto, updated, { excludeExtraneousValues: true });

    return this.authService.loginCustomerByDto(customerDto, res);
  }

  /**
   * @returns ResponseDto<ClientCustomerDto>
   */
  @Post('register')
  async register(@Body() registerDto: ClientRegisterDto, @Res() res: FastifyReply<ServerResponse>) {
    const customer = await this.customerService.clientRegisterCustomer(registerDto);
    const customerDto = plainToClass(ClientCustomerDto, customer, { excludeExtraneousValues: true });

    return this.authService.loginCustomerByDto(customerDto, res);
  }

  /**
   * @returns ResponseDto<ClientCustomerDto>
   */
  @UseGuards(CustomerLocalGuard)
  @Post('login')
  async login(@Body() loginDto: LoginDto, @Req() req, @Res() res: FastifyReply<ServerResponse>) {
    const customer: DocumentType<Customer> = req.user;
    this.customerService.updateLastLoggedIn(customer.id);
    const customerDto = plainToClass(ClientCustomerDto, customer, { excludeExtraneousValues: true });

    return this.authService.loginCustomerByDto(customerDto, res);
  }

  @Post('init-reset-password')
  async initResetPassword(@Body() resetDto: InitResetPasswordDto) {
    const result = await this.customerService.initResetPassword(resetDto);
    return {
      data: result
    }
  }

  @Post('reset-password')
  async resetPassword(@Body() resetDto: ResetPasswordDto) {
    const result = await this.customerService.resetPassword(resetDto);
    return {
      data: result
    }
  }

  @Post('logout')
  async logout(@Res() res: FastifyReply<ServerResponse>) {
    return this.authService.logoutCustomer(res);
  }

  @UseGuards(CustomerJwtGuard)
  @Post('send-confirm-email')
  async sendEmailConfirmationEmail(@Req() req): Promise<ResponseDto<boolean>> {
    const customer: DocumentType<Customer> = req.user;
    await this.customerService.sendEmailConfirmationEmail(customer);

    return { data: true };
  }

  @UseGuards(CustomerJwtGuard)
  @Post('address')
  async addShippingAddress(@Req() req, @Body() addressDto: ShipmentAddressDto): Promise<ResponseDto<ClientCustomerDto>> {
    const customer: DocumentType<Customer> = req.user;
    const updated = await this.customerService.addShippingAddress(customer, addressDto);

    return {
      data: plainToClass(ClientCustomerDto, updated, { excludeExtraneousValues: true })
    };
  }

  @UseGuards(CustomerJwtGuard)
  @Put('address/:id')
  async editShippingAddress(@Req() req, @Param('id') addressId: string, @Body() addressDto: ShipmentAddressDto): Promise<ResponseDto<ClientCustomerDto>> {
    const customer: DocumentType<Customer> = req.user;
    const updated = await this.customerService.editShippingAddress(customer, addressId, addressDto);

    return {
      data: plainToClass(ClientCustomerDto, updated, { excludeExtraneousValues: true })
    };
  }

  @UseGuards(CustomerJwtGuard)
  @Patch()
  async updateCustomer(@Req() req, @Body() dto: ClientUpdateCustomerDto): Promise<ResponseDto<ClientCustomerDto>> {
    const customer: DocumentType<Customer> = req.user;
    const updated = await this.customerService.updateCustomerByClientDto(customer, dto);

    return {
      data: plainToClass(ClientCustomerDto, updated, { excludeExtraneousValues: true })
    }
  }
}
