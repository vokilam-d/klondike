import { isProdEnv } from './is-prod-env.function';
import { isPrimaryInstance } from './is-primary-instance.function';

export function isProdPrimaryInstance(): boolean {
  return isProdEnv() && isPrimaryInstance();
}
