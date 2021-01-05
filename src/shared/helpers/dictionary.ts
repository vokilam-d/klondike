type K = {
  [key: string]: any;
};

/**
 * Simple dictionary implementations
 * keys to this map can be only 1-level or 2-level nested objects
 */
export class Dictionary<V> {
  private map: Map<string, V> = new Map();

  set(key: K, value: V): this {
    const transformedKey = Dictionary.stringifyKey(key);
    this.map.set(transformedKey, value);
    return this;
  }

  get(key: K): V | undefined {
    const transformedKey = Dictionary.stringifyKey(key);
    return this.map.get(transformedKey);
  }

  clear(): void {
    this.map.clear();
  }

  delete(key: K): boolean {
    const transformedKey = Dictionary.stringifyKey(key);
    return this.map.delete(transformedKey);
  }

  has(key: K): boolean {
    const transformedKey = Dictionary.stringifyKey(key);
    return this.map.has(transformedKey);
  }

  private static stringifyKey(keyObj: K): string {
    const resultObj = {};
    const sortedKeys = Object.keys(keyObj).sort();
    for (const sortedKey of sortedKeys) {
      const value = keyObj[sortedKey];
      resultObj[sortedKey] = JSON.stringify(value);
    }

    return JSON.stringify(resultObj);
  }
}
