import { forwardRef, Module } from '@nestjs/common';
import { AuthService } from './services/auth.service';
import { CustomerModule } from '../customer/customer.module';
import { CustomerLocalStrategy } from './customer-strategies/local.strategy';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { authConstants } from './auth-constants';
import { CustomerJwtStrategy } from './customer-strategies/jwt.strategy';
import { ResetPassword, ResetPasswordModel } from './models/reset-password.model';
import { MongooseModule } from '@nestjs/mongoose';
import { ResetPasswordService } from './services/reset-password.service';
import { EmailModule } from '../email/email.module';
import { ConfirmEmailService } from './services/confirm-email.service';
import { ConfirmEmail, ConfirmEmailModel } from './models/confirm-email.model';

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
    PassportModule,
    EmailModule
  ],
  providers: [
    AuthService,
    CustomerLocalStrategy,
    CustomerJwtStrategy,
    ResetPasswordService,
    ConfirmEmailService
  ],
  exports: [AuthService]
})
export class AuthModule {}
