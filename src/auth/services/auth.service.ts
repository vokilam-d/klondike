import { BadRequestException, forwardRef, Inject, Injectable } from '@nestjs/common';
import { CustomerService } from '../../customer/customer.service';
import { Customer } from '../../customer/models/customer.model';
import { JwtService } from '@nestjs/jwt';
import { ServerResponse } from 'http';
import { FastifyReply, FastifyRequest } from 'fastify';
import { authConstants } from '../auth-constants';
import { ClientCustomerDto } from '../../shared/dtos/client/customer.dto';
import { ResponseDto } from '../../shared/dtos/shared-dtos/response.dto';
import { EmailService } from '../../email/email.service';
import { ResetPasswordService } from './reset-password.service';
import { ConfirmEmailService } from './confirm-email.service';
import { EncryptorService } from '../../shared/services/encryptor/encryptor.service';

@Injectable()
export class AuthService {

  constructor(@Inject(forwardRef(() => CustomerService)) private readonly customerService: CustomerService,
              private readonly resetPasswordService: ResetPasswordService,
              private readonly confirmEmailService: ConfirmEmailService,
              private readonly encryptor: EncryptorService,
              private readonly emailService: EmailService,
              private readonly jwtService: JwtService) {
  }

  async getCustomerFromReq(req: FastifyRequest): Promise<Customer | undefined> {
    const jwt = req.cookies[authConstants.JWT_COOKIE_NAME];
    if (!jwt) { return; }

    const payload = await this.jwtService.verifyAsync(jwt);
    if (!payload || !payload.sub) { return; }

    return this.customerService.getCustomerById(payload.sub);
  }

  async createCustomerEmailConfirmToken(customer: Customer): Promise<string> {
    const confirmModel = await this.confirmEmailService.create(customer);
    return confirmModel.token;
  }

  async loginCustomer(customerDto: ClientCustomerDto, res: FastifyReply<ServerResponse>) {
    const payload = { sub: customerDto.id };
    const jwt = await this.jwtService.signAsync(payload);
    const returnValue: ResponseDto<ClientCustomerDto> = {
      data: customerDto
    };

    res
      .setCookie(authConstants.JWT_COOKIE_NAME, jwt, this.getCookieOptions() as any)
      .send(returnValue);
  }

  async validateCustomer(login: string, password: string): Promise<Customer | null> {
    const customer = await this.customerService.getCustomerByEmailOrPhoneNumber(login);
    if (!customer) { return null; }

    if (customer.password === null) {
      await this.initResetCustomerPassword(customer);
      throw new BadRequestException('Your password is outdated, we sent you an email with the instruction on how to update your password');
    }

    const isValidPassword = await this.encryptor.validatePassword(password, customer.password);
    if (!isValidPassword) { return null; }

    return customer;
  }

  async initResetCustomerPassword(customer: Customer) {
    const resetModel = await this.resetPasswordService.create(customer);
    this.emailService.sendResetPasswordEmail(customer, resetModel.token);

    return;
  }

  logout(res: FastifyReply<ServerResponse>) {
    res
      .clearCookie(authConstants.JWT_COOKIE_NAME)
      .send();
  }

  private getCookieOptions() {
    const expires = new Date();
    expires.setMonth(expires.getMonth() + 1);

    return {
      httpOnly: true,
      secure: false,
      expires,
      path: '/'
    };
  }
}
