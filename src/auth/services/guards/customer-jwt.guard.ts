import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { authConstants } from '../../auth-constants';

@Injectable()
export class CustomerJwtGuard extends AuthGuard(authConstants.CUSTOMER_JWT_STRATEGY_NAME) { }
