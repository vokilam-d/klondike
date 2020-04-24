export function isProdEnv(): boolean {
  return process.env.NODE_ENV === 'production';
}
