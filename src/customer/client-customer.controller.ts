import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Get,
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
import { LoginDto } from '../shared/dtos/shared/login.dto';
import { AuthGuard } from '@nestjs/passport';
import { authConstants } from '../auth/auth-constants';
import { Customer } from './models/customer.model';
import { plainToClass } from 'class-transformer';
import { ClientCustomerDto } from '../shared/dtos/client/customer.dto';
import { AuthService } from '../auth/services/auth.service';
import { ResponseDto } from '../shared/dtos/shared/response.dto';
import { ResetPasswordDto } from '../shared/dtos/client/reset-password.dto';

@UsePipes(new ValidationPipe({ transform: true }))
@UseInterceptors(ClassSerializerInterceptor)
@Controller('customer')
export class ClientCustomerController {

  constructor(private customerService: CustomerService,
              private authService: AuthService) {
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
    const customer: Customer = req.user;
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
  async getAccount(@Req() req): Promise<ResponseDto<ClientCustomerDto>> {
    const customer: Customer = req.user;

    return {
      data: plainToClass(ClientCustomerDto, customer, { excludeExtraneousValues: true })
    };
  }
}
