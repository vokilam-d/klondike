import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-jwt';
import { FastifyRequest } from 'fastify';
import { authConstants } from '../auth-constants';
import { UserService } from '../../user/user.service';
import { User } from '../../user/models/user.model';

@Injectable()
export class UserJwtStrategy extends PassportStrategy(Strategy, authConstants.USER_JWT_STRATEGY_NAME) {

  constructor(private userService: UserService) {
    super({
      jwtFromRequest: (req: FastifyRequest) => {
        let token = null;
        if (req && req.cookies) {
          token = req.cookies[authConstants.JWT_ADMIN_COOKIE_NAME];
        }
        return token;
      },
      ignoreExpiration: false,
      secretOrKey: authConstants.JWT_SECRET
    });
  }

  async validate(payload: any): Promise<User> {
    return this.userService.getUserById(payload.sub);
  }
}
