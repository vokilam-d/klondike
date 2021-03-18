export function isPrimaryInstance(): boolean {
  const instanceId = process.env.INSTANCE_ID;

  return instanceId === undefined || instanceId === '0';
}
