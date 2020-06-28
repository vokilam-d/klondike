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
        return 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI1ZTg4OGI5NTUyYzA2NDBmZTUzYWU4ZmMiLCJpYXQiOjE1OTEzODI3NDYsImV4cCI6MTU5Mzk3NDc0Nn0.LbeL5Gqp2vwpLwD3P_8mSswRkLqv7uIfuNpeTPf9hIw';
        // return req?.cookies?.[authConstants.JWT_ADMIN_COOKIE_NAME];
      },
      ignoreExpiration: false,
      secretOrKey: authConstants.JWT_SECRET
    });
  }

  async validate(payload: any): Promise<User> {
    return this.userService.getUserById(payload.sub);
  }
}
