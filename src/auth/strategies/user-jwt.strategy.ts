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
        return 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI1ZTg4OGFjZjUyYzA2NDBmZTUzYWU4ZmIiLCJpYXQiOjE1OTYxODYxNjIsImV4cCI6MTU5ODc3ODE2Mn0.PTjKoWC9jOH_6Q7LjdiExYt4SPkN9NCyQZKWSEFtWuc';
        return req?.cookies?.[authConstants.JWT_ADMIN_COOKIE_NAME];
      },
      ignoreExpiration: false,
      secretOrKey: authConstants.JWT_SECRET
    });
  }

  async validate(payload: any): Promise<User> {
    return this.userService.getUserById(payload.sub);
  }
}
