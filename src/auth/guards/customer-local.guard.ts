import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { authConstants } from '../auth-constants';

@Injectable()
export class CustomerLocalGuard extends AuthGuard(authConstants.CUSTOMER_LOCAL_STRATEGY_NAME) { }
