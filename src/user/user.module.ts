import { forwardRef, Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserModel } from './models/user.model';
import { AuthModule } from '../auth/auth.module';

const userModel = {
  name: UserModel.modelName,
  schema: UserModel.schema,
  collection: User.collectionName
}
@Module({
  imports: [
    MongooseModule.forFeature([userModel]),
    forwardRef(() => AuthModule)
  ],
  controllers: [
    UserController
  ],
  providers: [
    UserService
  ],
  exports: [
    UserService
  ]
})
export class UserModule {}
