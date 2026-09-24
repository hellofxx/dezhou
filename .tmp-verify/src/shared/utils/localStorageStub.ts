/**
 * 测试专用 localStorage 内存桩（供各模块 store migrate 测试复用）。
 * 仅被 *.test.ts 引用，不会进入生产 bundle。
 */
export interface LocalStorageStub {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
  clear: () => void;
  key: (index: number) => string | null;
  readonly length: number;
}

export function createLocalStorageStub(seed: Record<string, string> = {}): LocalStorageStub {
  const map = new Map<string, string>(Object.entries(seed));
  return {
    getItem: (key) => map.get(key) ?? null,
    setItem: (key, value) => {
      map.set(key, value);
    },
    removeItem: (key) => {
      map.delete(key);
    },
    clear: () => {
      map.clear();
    },
    key: (index) => [...map.keys()][index] ?? null,
    get length() {
      return map.size;
    },
  };
}

/** 构造 zustand persist 的存储 JSON（{ state, version }） */
export function buildPersistPayload(state: unknown, version: number): string {
  return JSON.stringify({ state, version });
}
