import { User } from '../../user/models/user.model';
import { Role } from '../enums/Role.enum';

export const havePermissions = (currentUser: User, minimumAccessLevel: Role): boolean => {
  return currentUser.role <= minimumAccessLevel;
}
