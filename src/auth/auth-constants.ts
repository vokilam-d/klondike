import { Customer } from '../customer/models/customer.model';
import { LoginDto } from '../shared/dtos/shared-dtos/login.dto';
import { UserDto } from '../shared/dtos/admin/user.dto';
import { User } from '../user/models/user.model';

const userNameField: keyof LoginDto | UserDto = 'login';

export const authConstants = {
  USERNAME_FIELD: userNameField,
  JWT_COOKIE_NAME: 'jwt',
  JWT_ADMIN_COOKIE_NAME: 'jwt-admin',
  JWT_SECRET: process.env.JWT_SECRET,
  CUSTOMER_LOCAL_STRATEGY_NAME: `${Customer.collectionName}-local`,
  CUSTOMER_JWT_STRATEGY_NAME: `${Customer.collectionName}-JWT`,
  USER_LOCAL_STRATEGY_NAME: `${User.collectionName}-local`,
  USER_JWT_STRATEGY_NAME: `${User.collectionName}-JWT`
};
