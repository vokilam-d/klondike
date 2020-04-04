import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { Injectable, NotFoundException } from '@nestjs/common';
import { AuthService } from '../services/auth.service';
import { authConstants } from '../auth-constants';

@Injectable()
export class UserLocalStrategy extends PassportStrategy(Strategy, authConstants.USER_LOCAL_STRATEGY_NAME) {

  constructor(private authService: AuthService) {
    super({ usernameField: authConstants.USERNAME_FIELD });
  }

  async validate(login: string, password: string) {
    const user = await this.authService.validateUser(login, password);
    if (!user) {
      throw new NotFoundException(`User with such login and password is not registred`);
    }

    return user;
  }
}
