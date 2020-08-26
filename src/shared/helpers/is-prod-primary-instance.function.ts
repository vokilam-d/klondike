import { isProdEnv } from './is-prod-env.function';

export function isProdPrimaryInstance(): boolean {
  const instanceId = process.env.INSTANCE_ID;

  return isProdEnv() && (instanceId === undefined || instanceId === '0');
}
