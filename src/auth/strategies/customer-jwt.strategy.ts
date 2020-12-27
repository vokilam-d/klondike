import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-jwt';
import { FastifyRequest } from 'fastify';
import { authConstants } from '../auth-constants';
import { Customer } from '../../customer/models/customer.model';
import { CustomerService } from '../../customer/customer.service';
import { isProdEnv } from '../../shared/helpers/is-prod-env.function';

@Injectable()
export class CustomerJwtStrategy extends PassportStrategy(Strategy, authConstants.CUSTOMER_JWT_STRATEGY_NAME) {

  constructor(private customerService: CustomerService) {
    super({
      jwtFromRequest: (req: FastifyRequest) => {
        const jwtCookie = req?.cookies?.[authConstants.JWT_COOKIE_NAME];

        if (isProdEnv()) {
          return jwtCookie || null;
        } else {
          const devJwt = process.env.DEV_CUSTOMER_JWT;
          return jwtCookie || devJwt || null;
        }
      },
      ignoreExpiration: false,
      secretOrKey: authConstants.JWT_SECRET
    });
  }

  async validate(payload: any): Promise<Customer> {
    const customer = await this.customerService.getCustomerById(payload.sub, false);
    return customer;
  }
}
