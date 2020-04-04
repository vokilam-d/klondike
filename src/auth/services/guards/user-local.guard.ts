import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { authConstants } from '../../auth-constants';

@Injectable()
export class UserLocalGuard extends AuthGuard(authConstants.USER_LOCAL_STRATEGY_NAME) { }
