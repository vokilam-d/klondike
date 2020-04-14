import { forwardRef, Module } from '@nestjs/common';
import { AuthService } from './services/auth.service';
import { CustomerModule } from '../customer/customer.module';
import { CustomerLocalStrategy } from './strategies/customer-local.strategy';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { authConstants } from './auth-constants';
import { CustomerJwtStrategy } from './strategies/customer-jwt.strategy';
import { ResetPassword, ResetPasswordModel } from './models/reset-password.model';
import { MongooseModule } from '@nestjs/mongoose';
import { ResetPasswordService } from './services/reset-password.service';
import { EmailModule } from '../email/email.module';
import { ConfirmEmailService } from './services/confirm-email.service';
import { ConfirmEmail, ConfirmEmailModel } from './models/confirm-email.model';
import { UserModule } from '../user/user.module';
import { UserLocalStrategy } from './strategies/user-local.strategy';
import { UserJwtStrategy } from './strategies/user-jwt.strategy';

const resetPasswordModel = {
  name: ResetPasswordModel.modelName,
  schema: ResetPasswordModel.schema,
  collection: ResetPassword.collectionName
};

const confirmEmailModel = {
  name: ConfirmEmailModel.modelName,
  schema: ConfirmEmailModel.schema,
  collection: ConfirmEmail.collectionName
};


@Module({
  imports: [
    MongooseModule.forFeature([resetPasswordModel, confirmEmailModel]),
    JwtModule.register({
      secret: authConstants.JWT_SECRET,
      signOptions: {
        expiresIn: '30 days'
      }
    }),
    forwardRef(() => CustomerModule),
    forwardRef(() => UserModule),
    forwardRef(() => EmailModule),
    PassportModule
  ],
  providers: [
    AuthService,
    CustomerLocalStrategy,
    CustomerJwtStrategy,
    UserLocalStrategy,
    UserJwtStrategy,
    ResetPasswordService,
    ConfirmEmailService
  ],
  exports: [AuthService]
})
export class AuthModule {}
