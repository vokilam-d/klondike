import { isProdEnv } from './is-prod-env.function';

export function isPropPrimaryInstance(): boolean {
  const instanceId = process.env.INSTANCE_ID;

  return isProdEnv() && (instanceId === undefined || instanceId === '0');
}
