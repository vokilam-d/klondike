import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { authConstants } from '../auth-constants';

@Injectable()
export class UserJwtGuard extends AuthGuard(authConstants.USER_JWT_STRATEGY_NAME) { }
