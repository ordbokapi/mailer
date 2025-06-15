export class FakeRedisClient {
  #lists = new Map<string, string[]>();
  #hashes = new Map<string, Map<string, string>>();
  #strings = new Map<string, string>();

  isOpen = true;
  isReady = true;

  connect(): Promise<this> {
    return Promise.resolve(this);
  }
  /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
  on(_event: string, _callback: (...args: any[]) => void): this {
    return this;
  }

  rPush(key: string, ...values: string[]): Promise<number> {
    const list = this.#lists.get(key) || [];

    list.push(...values);
    this.#lists.set(key, list);

    return Promise.resolve(list.length);
  }

  lPop(key: string): Promise<string | null> {
    const list = this.#lists.get(key) || [];
    const value = list.shift() || null;

    this.#lists.set(key, list);

    return Promise.resolve(value);
  }

  hSet(key: string, field: string, value: string): Promise<number> {
    const hash = this.#hashes.get(key) || new Map<string, string>();
    const isNew = hash.has(field) ? 0 : 1;

    hash.set(field, value);
    this.#hashes.set(key, hash);

    return Promise.resolve(isNew);
  }

  hGetAll(key: string): Promise<Record<string, string>> {
    const hash = this.#hashes.get(key) || new Map<string, string>();
    const obj: Record<string, string> = {};

    hash.forEach((v, k) => {
      obj[k] = v;
    });

    return Promise.resolve(obj);
  }

  hDel(key: string, field: string): Promise<number> {
    const hash = this.#hashes.get(key);

    if (!hash) {
      return Promise.resolve(0);
    }

    const existed = hash.delete(field) ? 1 : 0;

    return Promise.resolve(existed);
  }

  hExists(key: string, field: string): Promise<boolean> {
    const hash = this.#hashes.get(key);

    return Promise.resolve(hash?.has(field) || false);
  }

  hGet(key: string, field: string): Promise<string | null> {
    const hash = this.#hashes.get(key);

    return Promise.resolve(hash?.get(field) ?? null);
  }

  hmGet(key: string, fields: string[]): Promise<(string | null)[]> {
    const hash = this.#hashes.get(key) || new Map<string, string>();

    return Promise.resolve(fields.map((f) => hash.get(f) ?? null));
  }

  /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
  set(key: string, value: string, _opts: any): Promise<'OK'> {
    this.#strings.set(key, value);

    return Promise.resolve('OK');
  }

  get(key: string): Promise<string | null> {
    return Promise.resolve(this.#strings.get(key) ?? null);
  }

  del(key: string): Promise<number> {
    if (this.#strings.has(key)) {
      this.#strings.delete(key);

      return Promise.resolve(1);
    }

    return Promise.resolve(0);
  }

  quit(): Promise<void> {
    this.isOpen = false;
    this.isReady = false;

    return Promise.resolve();
  }

  [key: string]: any;
}
