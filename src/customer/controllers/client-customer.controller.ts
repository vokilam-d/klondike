import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Get,
  Param,
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
import { ClientCustomerDto } from '../../shared/dtos/client/customer.dto';
import { AuthService } from '../../auth/services/auth.service';
import { ResponseDto } from '../../shared/dtos/shared-dtos/response.dto';
import { DocumentType } from '@typegoose/typegoose';
import { ClientUpdatePasswordDto } from '../../shared/dtos/client/update-password.dto';
import { CustomerJwtGuard } from '../../auth/guards/customer-jwt.guard';
import { CustomerLocalGuard } from '../../auth/guards/customer-local.guard';
import { InitResetPasswordDto } from '../../shared/dtos/client/init-reset-password.dto';
import { ResetPasswordDto } from '../../shared/dtos/client/reset-password.dto';
import { OrderService } from '../../order/services/order.service';
import { OrderFilterDto } from '../../shared/dtos/admin/order-filter.dto';
import { ClientOrderDto } from '../../shared/dtos/client/order.dto';
import { ShipmentAddressDto } from '../../shared/dtos/shared-dtos/shipment-address.dto';
import { ConfirmEmailDto } from '../../shared/dtos/client/confirm-email.dto';
import { ClientLang } from '../../shared/decorators/lang.decorator';
import { Language } from '../../shared/enums/language.enum';
import { ValidatedUser } from '../../shared/decorators/validated-user.decorator';
import { CustomerContactInfoDto } from '../../shared/dtos/shared-dtos/customer-contact-info.dto';

@UsePipes(new ValidationPipe({ transform: true }))
@UseInterceptors(ClassSerializerInterceptor)
@Controller('customer')
export class ClientCustomerController {

  constructor(
    private customerService: CustomerService,
    private orderService: OrderService,
    private authService: AuthService
  ) { }

  @Get()
  async getInfo(@Req() req, @ClientLang() lang: Language): Promise<ResponseDto<ClientCustomerDto | null>> {
    const customer: Customer = await this.authService.getCustomerFromReq(req, lang);
    const dto = customer ? ClientCustomerDto.transformToDto(customer, lang) : null;

    return {
      data: dto
    };
  }

  @Get('google/callback')
  googleLoginCallback(
    @Req() req,
    @Res() res: FastifyReply<ServerResponse>,
    @ClientLang() lang: Language
  ) {
    return this.authService.callbackOAuthGoogle(req, res, lang);
  }

  @Get('facebook/callback')
  facebookLoginCallback(
    @Req() req,
    @Res() res: FastifyReply<ServerResponse>,
    @ClientLang() lang: Language
  ) {
    return this.authService.callbackOAuthFacebook(req, res, lang);
  }

  @UseGuards(CustomerJwtGuard)
  @Get('details')
  async getAccount(@ValidatedUser() customer: Customer, @ClientLang() lang: Language): Promise<ResponseDto<ClientCustomerDto>> {
    return {
      data: ClientCustomerDto.transformToDto(customer, lang)
    };
  }

  @UseGuards(CustomerJwtGuard)
  @Get('order')
  async getOrders(
    @ValidatedUser() customer: Customer,
    @ClientLang() lang: Language
  ): Promise<ResponseDto<ClientOrderDto[]>> {
    const orderFilterDto = new OrderFilterDto();
    orderFilterDto.customerId = customer.id;
    orderFilterDto.limit = 100;
    const { data: orders } = await this.orderService.getOrdersList(orderFilterDto);

    return {
      data: orders.map(order => ClientOrderDto.transformToDto(order, lang))
    };
  }

  /**
   * @returns ResponseDto<ClientCustomerDto>
   */
  @UseGuards(CustomerJwtGuard)
  @Post('password')
  async updatePassword(
    @ValidatedUser() customer: DocumentType<Customer>,
    @Body() dto: ClientUpdatePasswordDto,
    @Res() res: FastifyReply<ServerResponse>,
    @ClientLang() lang: Language
  ) {
    const updated = await this.customerService.checkAndUpdatePassword(customer, dto, lang);
    const customerDto = ClientCustomerDto.transformToDto(updated, lang);

    return this.authService.loginCustomerByDto(customerDto, res);
  }

  /**
   * @returns ResponseDto<ClientCustomerDto>
   */
  @Post('register')
  async register(
    @Body() registerDto: ClientRegisterDto,
    @Res() res: FastifyReply<ServerResponse>,
    @ClientLang() lang: Language
  ) {
    const customer = await this.customerService.clientRegisterCustomer(registerDto, lang);
    const customerDto = ClientCustomerDto.transformToDto(customer, lang);

    return this.authService.loginCustomerByDto(customerDto, res);
  }

  /**
   * @returns ResponseDto<ClientCustomerDto>
   */
  @UseGuards(CustomerLocalGuard)
  @Post('login')
  async login(
    @Body() loginDto: LoginDto,
    @ValidatedUser() customer: DocumentType<Customer>,
    @Res() res: FastifyReply<ServerResponse>,
    @ClientLang() lang: Language
  ) {
    this.customerService.updateLastLoggedIn(customer.id);
    const customerDto = ClientCustomerDto.transformToDto(customer, lang);

    return this.authService.loginCustomerByDto(customerDto, res);
  }

  @Post('init-reset-password')
  async initResetPassword(@Body() resetDto: InitResetPasswordDto, @ClientLang() lang: Language) {
    const result = await this.customerService.initResetPassword(resetDto, lang);
    return {
      data: result
    }
  }

  @Post('reset-password')
  async resetPassword(@Body() resetDto: ResetPasswordDto, @ClientLang() lang: Language) {
    const result = await this.customerService.resetPassword(resetDto, lang);
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
  async sendEmailConfirmationEmail(
    @ValidatedUser() customer: DocumentType<Customer>,
    @ClientLang() lang: Language
  ): Promise<ResponseDto<boolean>> {
    await this.customerService.sendEmailConfirmationEmail(customer, lang);

    return { data: true };
  }

  @Post('confirm-email')
  async confirmEmail(@Body() confirmEmailDto: ConfirmEmailDto, @ClientLang() lang: Language): Promise<ResponseDto<boolean>> {
    await this.customerService.initEmailConfirmation(confirmEmailDto.token, lang);
    return { data: true };
  }

  @UseGuards(CustomerJwtGuard)
  @Post('address')
  async addShippingAddress(
    @ValidatedUser() customer: DocumentType<Customer>,
    @Body() addressDto: ShipmentAddressDto,
    @ClientLang() lang: Language
  ): Promise<ResponseDto<ClientCustomerDto>> {

    const updated = await this.customerService.addShippingAddress(customer, addressDto);

    return {
      data: ClientCustomerDto.transformToDto(updated, lang)
    };
  }

  @UseGuards(CustomerJwtGuard)
  @Put('address/:id')
  async editShippingAddress(
    @ValidatedUser() customer: DocumentType<Customer>,
    @Param('id') addressId: string,
    @Body() addressDto: ShipmentAddressDto,
    @ClientLang() lang: Language
  ): Promise<ResponseDto<ClientCustomerDto>> {

    const updated = await this.customerService.editShippingAddress(customer, addressId, addressDto, lang);

    return {
      data: ClientCustomerDto.transformToDto(updated, lang)
    };
  }

  @UseGuards(CustomerJwtGuard)
  @Put('contact-info')
  async updateCustomer(
    @ValidatedUser() customer: DocumentType<Customer>,
    @Body() dto: CustomerContactInfoDto,
    @ClientLang() lang: Language
  ): Promise<ResponseDto<ClientCustomerDto>> {

    const updated = await this.customerService.updateContactInfo(customer, dto);

    return {
      data: ClientCustomerDto.transformToDto(updated, lang)
    }
  }
}
