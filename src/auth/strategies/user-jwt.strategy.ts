import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-jwt';
import { FastifyRequest } from 'fastify';
import { authConstants } from '../auth-constants';
import { UserService } from '../../user/user.service';
import { User } from '../../user/models/user.model';
import { isProdEnv } from '../../shared/helpers/is-prod-env.function';

@Injectable()
export class UserJwtStrategy extends PassportStrategy(Strategy, authConstants.USER_JWT_STRATEGY_NAME) {

  constructor(private userService: UserService) {
    super({
      jwtFromRequest: (req: FastifyRequest) => {
        const jwtCookie = req?.cookies?.[authConstants.JWT_ADMIN_COOKIE_NAME];

        if (isProdEnv()) {
          return jwtCookie || null;
        } else {
          const devJwt = process.env.DEV_USER_JWT;
          return jwtCookie || devJwt || null;
        }
      },
      ignoreExpiration: false,
      secretOrKey: authConstants.JWT_SECRET
    });
  }

  async validate(payload: any): Promise<User> {
    return this.userService.getUserById(payload.sub);
  }
}
