import { BadRequestException, forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
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
import { DocumentType } from '@typegoose/typegoose';
import { User } from '../../user/models/user.model';
import { UserService } from '../../user/user.service';
import { UserDto } from '../../shared/dtos/admin/user.dto';
import { __ } from '../../shared/helpers/translate/translate.function';

@Injectable()
export class AuthService {

  private logger = new Logger(AuthService.name);

  constructor(@Inject(forwardRef(() => CustomerService)) private readonly customerService: CustomerService,
              private readonly userService: UserService,
              private readonly resetPasswordService: ResetPasswordService,
              private readonly confirmEmailService: ConfirmEmailService,
              private readonly encryptor: EncryptorService,
              private readonly emailService: EmailService,
              private readonly jwtService: JwtService) {
  }

  getCustomerIdFromReq(req: FastifyRequest): Promise<number | undefined> {
    return this.getEntityIdFromReq(req, authConstants.JWT_COOKIE_NAME).then(id => parseInt(id));
  }

  async getCustomerFromReq(req: FastifyRequest): Promise<DocumentType<Customer> | undefined> {
    const id = await this.getCustomerIdFromReq(req);
    if (!id) { return; }

    const customer = await this.customerService.getCustomerById(+id, false);
    return customer as DocumentType<Customer>;
  }

  async getUserFromReq(req: FastifyRequest): Promise<DocumentType<User> | undefined> {
    const id = await this.getEntityIdFromReq(req, authConstants.JWT_ADMIN_COOKIE_NAME);
    return this.userService.getUserById(id);
  }

  private async getEntityIdFromReq(req: FastifyRequest, cookieName: string): Promise<string | undefined> {
    const jwt = req.cookies[cookieName];
    if (!jwt) { return; }

    try {
      const payload = await this.jwtService.verifyAsync(jwt);
      return payload?.sub;
    } catch (e) {
      this.logger.error(e);
    }
  }

  async createCustomerEmailConfirmToken(customer: Customer): Promise<string> {
    const confirmModel = await this.confirmEmailService.create(customer);
    return confirmModel.token;
  }

  async loginCustomer(customerDto: ClientCustomerDto, res: FastifyReply<ServerResponse>) {
    return this.login(customerDto, res, authConstants.JWT_COOKIE_NAME);
  }

  async loginUser(userDto: UserDto, res: FastifyReply<ServerResponse>) {
    return this.login(userDto, res, authConstants.JWT_ADMIN_COOKIE_NAME);
  }

  async login<T>(entity: T & { id: any; }, res: FastifyReply<ServerResponse>, cookieName: string) {
    const payload = { sub: entity.id };
    const jwt = await this.jwtService.signAsync(payload);
    const returnValue: ResponseDto<T> = {
      data: entity
    };

    res
      .setCookie(cookieName, jwt, this.getCookieOptions() as any)
      .send(returnValue);
  }

  async validateCustomer(login: string, password: string): Promise<Customer | null> {
    const customer = await this.customerService.getCustomerByEmailOrPhoneNumber(login);
    if (!customer) { return null; }

    if (customer.password === null) {
      await this.initResetCustomerPassword(customer);
      throw new BadRequestException(__('Your password is outdated, we sent you an email with the instruction on how to update your password', 'ru'));
    }

    const isValidPassword = await this.encryptor.validatePassword(password, customer.password);
    if (!isValidPassword) { return null; }

    return customer;
  }

  async validateUser(login: string, password: string): Promise<User | null> {
    const user = await this.userService.getUserByLogin(login);
    if (!user) { return null; }

    const isValidPassword = await this.encryptor.validatePassword(password, user.password);
    if (!isValidPassword) { return null; }

    return user;
  }

  async initResetCustomerPassword(customer: Customer) {
    const resetModel = await this.resetPasswordService.create(customer);
    this.emailService.sendResetPasswordEmail(customer, resetModel.token);

    return;
  }

  logoutCustomer(res: FastifyReply<ServerResponse>) {
    this.logout(res, authConstants.JWT_COOKIE_NAME);
  }

  logoutUser(res: FastifyReply<ServerResponse>) {
    this.logout(res, authConstants.JWT_ADMIN_COOKIE_NAME);
  }

  private logout(res: FastifyReply<ServerResponse>, cookieName) {
    res
      .clearCookie(cookieName)
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
