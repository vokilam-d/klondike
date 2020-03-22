import { Customer } from '../customer/models/customer.model';
import { LoginDto } from '../shared/dtos/shared/login.dto';

const userNameField: keyof LoginDto = 'login';

export const authConstants = {
  USERNAME_FIELD: userNameField,
  JWT_COOKIE_NAME: 'jwt',
  JWT_SECRET: process.env.JWT_SECRET,
  CUSTOMER_LOCAL_STRATEGY_NAME: `${Customer.collectionName}-local`,
  CUSTOMER_JWT_STRATEGY_NAME: `${Customer.collectionName}-JWT`
};
