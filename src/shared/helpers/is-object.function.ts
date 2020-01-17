export function isObject(value) {
  const type = typeof value;
  return !!value && type !== 'function' && type === 'object';
}
