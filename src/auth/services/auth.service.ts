import { BadRequestException, forwardRef, HttpService, Inject, Injectable, Logger } from '@nestjs/common';
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
import { HttpAdapterHost } from '@nestjs/core';
import { NestFastifyApplication } from '@nestjs/platform-fastify';
import { isProdEnv } from '../../shared/helpers/is-prod-env.function';

interface IGoogleIDToken {
  sub: string;
  name: string;
  given_name: string;
  family_name: string;
  picture: string;
  email: string;
  email_verified: boolean,
  locale: string;
}

interface IFacebookIDToken {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
}

@Injectable()
export class AuthService {

  private logger = new Logger(AuthService.name);

  constructor(@Inject(forwardRef(() => CustomerService)) private readonly customerService: CustomerService,
              private readonly userService: UserService,
              private readonly http: HttpService,
              private readonly resetPasswordService: ResetPasswordService,
              private readonly confirmEmailService: ConfirmEmailService,
              private readonly adapterHost: HttpAdapterHost,
              private readonly encryptor: EncryptorService,
              private readonly emailService: EmailService,
              private readonly jwtService: JwtService) {
  }

  async getCustomerIdFromReq(req: FastifyRequest): Promise<number | undefined> {
    const id = await this.getEntityIdFromReq(req, authConstants.JWT_COOKIE_NAME);
    const parsed = parseInt(id);
    if (Number.isNaN(parsed)) { return; }

    return parsed;
  }

  async getCustomerFromReq(req: FastifyRequest): Promise<DocumentType<Customer> | undefined> {
    const id = await this.getCustomerIdFromReq(req);
    if (!id) { return; }

    const customer = await this.customerService.getCustomerById(id, false);
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

  async loginCustomerByDto(customerDto: ClientCustomerDto, res: FastifyReply<ServerResponse>) {
    return this.login(customerDto, res, authConstants.JWT_COOKIE_NAME);
  }

  async callbackOAuthGoogle(req: FastifyRequest, res: FastifyReply<ServerResponse>) {
    const instance = this.adapterHost.httpAdapter.getInstance<NestFastifyApplication>();
    const token = await instance[authConstants.GOOGLE_OAUTH_NAMESPACE].getAccessTokenFromAuthorizationCodeFlow(req);

    if (!token) {
      throw new BadRequestException(__('Token in request not found', 'ru'));
    }

    const { data: googleIDToken } = await this.http.get<IGoogleIDToken>(
      `https://www.googleapis.com/oauth2/v3/userinfo`,
      { headers: { 'Authorization': `Bearer ${token.access_token}` } }
    ).toPromise();

    return this.callbackOAuth(googleIDToken.given_name, googleIDToken.family_name, googleIDToken.email, res);
  }

  async callbackOAuthFacebook(req: FastifyRequest, res: FastifyReply<ServerResponse>) {
    const instance = this.adapterHost.httpAdapter.getInstance<NestFastifyApplication>();
    const token = await instance[authConstants.FACEBOOK_OAUTH_NAMESPACE].getAccessTokenFromAuthorizationCodeFlow(req);

    if (!token) {
      throw new BadRequestException(__('Token in request not found', 'ru'));
    }

    const { data: facebookIDToken } = await this.http.get<IFacebookIDToken>(
      `https://graph.facebook.com/v6.0/me`,
      { headers: { 'Authorization': `Bearer ${token.access_token}` }, params: { fields: 'email,first_name,last_name' } }
    ).toPromise();

    return this.callbackOAuth(facebookIDToken.first_name, facebookIDToken.last_name, facebookIDToken.email, res);
  }

  private async callbackOAuth(firstName: string, lastName: string, email: string, res: FastifyReply<ServerResponse>) {
    let customer: DocumentType<Customer> = await this.customerService.getCustomerByEmailOrPhoneNumber(email);
    if (customer) {
      try {
        await this.customerService.confirmCustomerEmail(customer);
      } catch (e) {
        this.logger.error(`Could not confirm customer email:`, e);
      }
    } else {
      customer = await this.customerService.createCustomerByThirdParty(firstName, lastName, email) as any;
    }

    const frontendOrigin = isProdEnv() ? '' : 'http://localhost:4002';
    const redirectHref = `${frontendOrigin}/oauth-success`;

    return this.login(customer, res, authConstants.JWT_COOKIE_NAME, redirectHref);
  }

  async loginUser(userDto: UserDto, res: FastifyReply<ServerResponse>) {
    return this.login(userDto, res, authConstants.JWT_ADMIN_COOKIE_NAME);
  }

  async login<T>(entity: T & { id: any; }, res: FastifyReply<ServerResponse>, cookieName: string, redirectPath?: string) {
    const payload = { sub: entity.id };
    const jwt = await this.jwtService.signAsync(payload);

    res.setCookie(cookieName, jwt, this.getCookieOptions() as any);

    if (redirectPath) {
      res.redirect(301, redirectPath);
    } else {
      const returnValue: ResponseDto<T> = {
        data: entity
      };
      res.send(returnValue);
    }
  }

  async validateCustomer(login: string, password: string): Promise<Customer | null> {
    const customer = await this.customerService.getCustomerByEmailOrPhoneNumber(login);
    if (!customer) { return null; }

    if (customer.password === null) {
      await this.initResetCustomerPassword(customer);
      throw new BadRequestException(__('Your password is outdated, we sent you an email with the instruction on how to update your password', 'ru'));
    }

    const isValidPassword = await this.encryptor.validate(password, customer.password);
    if (!isValidPassword) { return null; }

    return customer;
  }

  async validateUser(login: string, password: string): Promise<User | null> {
    const user = await this.userService.getUserByLogin(login);
    if (!user) { return null; }

    const isValidPassword = await this.encryptor.validate(password, user.password);
    if (!isValidPassword) { return null; }

    return user;
  }

  async initResetCustomerPassword(customer: Customer) {
    const resetModel = await this.resetPasswordService.create(customer);
    await this.emailService.sendResetPasswordEmail(customer, resetModel.token);

    return true;
  }

  async getCustomerIdByResetPasswordToken(token: string): Promise<number> {
    const resetModel = await this.resetPasswordService.getValidByToken(token);
    if (!resetModel) { return; }

    return resetModel.customerId;
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
      .send({ data: null });
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

  deleteResetPasswordToken(token: string) {
    return this.resetPasswordService.deleteByToken(token);
  }
}
