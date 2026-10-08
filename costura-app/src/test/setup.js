/**
 * Vitest global setup.
 *
 * Node 22+ ships a built-in global `localStorage` (Web Storage API) that stays
 * `undefined` unless the process runs with `--localstorage-file`. In the jsdom
 * environment that Node global shadows jsdom's own `window.localStorage`, so any
 * test touching Web Storage crashes with
 * "Cannot read properties of undefined (reading 'clear')".
 *
 * `sessionStorage` is unaffected because Node implements it in memory, which is
 * why only `localStorage` breaks.
 *
 * We install a minimal in-memory implementation only when the runtime does not
 * provide a usable one, keeping the real browser/jsdom storage untouched.
 */
function createMemoryStorage() {
  const store = new Map();
  return {
    get length() {
      return store.size;
    },
    key(index) {
      if (index < 0 || index >= store.size) return null;
      return [...store.keys()][index];
    },
    getItem(key) {
      const k = String(key);
      return store.has(k) ? store.get(k) : null;
    },
    setItem(key, value) {
      store.set(String(key), String(value));
    },
    removeItem(key) {
      store.delete(String(key));
    },
    clear() {
      store.clear();
    },
  };
}

if (typeof globalThis.localStorage === 'undefined') {
  try {
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      enumerable: true,
      value: createMemoryStorage(),
    });
  } catch {
    // Non-configurable global: cannot override. Tests needing storage will fail
    // loudly rather than silently skipping expectations.
  }
}
