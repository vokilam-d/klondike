export class Dictionary<K extends { [key: string]: any }, V> {
  private map: Map<string, V> = new Map();

  set(key: K, value: V): this {
    const transformedKey = this.stringifyKey(key);
    this.map.set(transformedKey, value);
    return this;
  }

  get(key: K): V | undefined {
    const transformedKey = this.stringifyKey(key);
    return this.map.get(transformedKey);
  }

  clear(): void {
    this.map.clear();
  }

  delete(key: K): boolean {
    const transformedKey = this.stringifyKey(key);
    return this.map.delete(transformedKey);
  }

  has(key: K): boolean {
    const transformedKey = this.stringifyKey(key);
    return this.map.has(transformedKey);
  }

  private stringifyKey(key: K): string {
    return JSON.stringify(key, Object.keys(key).sort());
  }
}
