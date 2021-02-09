import { User } from '../../user/models/user.model';
import { Role } from '../enums/role.enum';

export const hasPermissions = (currentUser: User, minimumAccessLevel: Role): boolean => {
  return isPermissionSameOrHigher(currentUser.role, minimumAccessLevel);
}

export const isPermissionSameOrLower = (accessLevel: Role, accessLevelToCompare: Role): boolean => {
  return accessLevel >= accessLevelToCompare;
}

export const isPermissionSameOrHigher = (accessLevel: Role, accessLevelToCompare: Role): boolean => {
  return accessLevel <= accessLevelToCompare;
}
