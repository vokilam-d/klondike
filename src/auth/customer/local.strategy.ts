import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { Injectable, NotFoundException } from '@nestjs/common';
import { AuthService } from '../services/auth.service';
import { authConstants } from '../auth-constants';

@Injectable()
export class CustomerLocalStrategy extends PassportStrategy(Strategy, authConstants.CUSTOMER_LOCAL_STRATEGY_NAME) {

  constructor(private authService: AuthService) {
    super({ usernameField: authConstants.USERNAME_FIELD });
  }

  async validate(login: string, password: string) {
    const customer = await this.authService.validateCustomer(login, password);
    if (!customer) {
      throw new NotFoundException(`User with such login and password is not registred`);
    }

    return customer;
  }
}
