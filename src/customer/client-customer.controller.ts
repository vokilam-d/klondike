import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Get, Patch,
  Post,
  Req,
  Res,
  UseGuards,
  UseInterceptors,
  UsePipes,
  ValidationPipe
} from '@nestjs/common';
import { CustomerService } from './customer.service';
import { ClientRegisterDto } from '../shared/dtos/client/register.dto';
import { FastifyReply } from 'fastify';
import { ServerResponse } from 'http';
import { LoginDto } from '../shared/dtos/shared-dtos/login.dto';
import { AuthGuard } from '@nestjs/passport';
import { authConstants } from '../auth/auth-constants';
import { Customer } from './models/customer.model';
import { plainToClass } from 'class-transformer';
import { ClientCustomerDto } from '../shared/dtos/client/customer.dto';
import { AuthService } from '../auth/services/auth.service';
import { ResponseDto } from '../shared/dtos/shared-dtos/response.dto';
import { ResetPasswordDto } from '../shared/dtos/client/reset-password.dto';
import { ClientAccountDto } from '../shared/dtos/client/account.dto';
import { ClientUpdateCustomerDto } from '../shared/dtos/client/update-customer.dto';
import { DocumentType } from '@typegoose/typegoose';
import { ClientUpdatePasswordDto } from '../shared/dtos/client/update-password.dto';

@UsePipes(new ValidationPipe({ transform: true }))
@UseInterceptors(ClassSerializerInterceptor)
@Controller('customer')
export class ClientCustomerController {

  constructor(private customerService: CustomerService,
              private authService: AuthService) {
  }

  @Get()
  async getInfo(@Req() req): Promise<ResponseDto<ClientCustomerDto | undefined>> {
    const customer: Customer = await this.authService.getCustomerFromReq(req);
    const dto = customer ? plainToClass(ClientCustomerDto, customer, { excludeExtraneousValues: true }) : null;

    return {
      data: dto
    };
  }

  @UseGuards(AuthGuard(authConstants.CUSTOMER_JWT_STRATEGY_NAME))
  @Get('account')
  async getAccount(@Req() req): Promise<ResponseDto<ClientAccountDto>> {
    const customer: DocumentType<Customer> = req.user;

    return {
      data: plainToClass(ClientAccountDto, customer, { excludeExtraneousValues: true })
    };
  }

  /**
   * @returns ResponseDto<ClientCustomerDto>
   */
  @UseGuards(AuthGuard(authConstants.CUSTOMER_JWT_STRATEGY_NAME))
  @Post('password')
  async updatePassword(@Req() req, @Body() dto: ClientUpdatePasswordDto, @Res() res: FastifyReply<ServerResponse>) {
    const customer: DocumentType<Customer> = req.user;
    const updated = await this.customerService.updatePassword(customer, dto);
    const customerDto = plainToClass(ClientCustomerDto, updated, { excludeExtraneousValues: true });

    return this.authService.loginCustomer(customerDto, res);
  }

  /**
   * @returns ResponseDto<ClientCustomerDto>
   */
  @Post('register')
  async register(@Body() registerDto: ClientRegisterDto, @Res() res: FastifyReply<ServerResponse>) {
    const customer = await this.customerService.clientCreateCustomer(registerDto);
    const customerDto = plainToClass(ClientCustomerDto, customer, { excludeExtraneousValues: true });

    return this.authService.loginCustomer(customerDto, res);
  }

  /**
   * @returns ResponseDto<ClientCustomerDto>
   */
  @UseGuards(AuthGuard(authConstants.CUSTOMER_LOCAL_STRATEGY_NAME))
  @Post('login')
  async login(@Body() loginDto: LoginDto, @Req() req, @Res() res: FastifyReply<ServerResponse>) {
    const customer: DocumentType<Customer> = req.user;
    this.customerService.updateLastLoggedIn(customer.id);
    const customerDto = plainToClass(ClientCustomerDto, customer, { excludeExtraneousValues: true });

    return this.authService.loginCustomer(customerDto, res);
  }

  @Post('reset')
  resetPassword(@Body() resetDto: ResetPasswordDto) {
    return this.customerService.resetPasswordByDto(resetDto);
  }

  @Post('logout')
  async logout(@Res() res: FastifyReply<ServerResponse>) {
    return this.authService.logout(res);
  }

  @UseGuards(AuthGuard(authConstants.CUSTOMER_JWT_STRATEGY_NAME))
  @Post('send-confirm-email')
  async sendEmailConfirmationEmail(@Req() req): Promise<ResponseDto<boolean>> {
    const customer: DocumentType<Customer> = req.user;
    await this.customerService.sendEmailConfirmationEmail(customer);

    return { data: true };
  }

  @UseGuards(AuthGuard(authConstants.CUSTOMER_JWT_STRATEGY_NAME))
  @Patch()
  async updateCustomer(@Req() req, @Body() dto: ClientUpdateCustomerDto): Promise<ResponseDto<ClientCustomerDto>> {
    const customer: DocumentType<Customer> = req.user;
    const updated = await this.customerService.updateCustomerByClientDto(customer, dto);

    return {
      data: plainToClass(ClientCustomerDto, updated, { excludeExtraneousValues: true })
    }
  }
}
