type AsyncLocalStorageLike = {
  run: <T>(store: object, fn: () => T) => T;
  getStore: () => object | undefined;
};

let als: AsyncLocalStorageLike | null = null;

function getALS(): AsyncLocalStorageLike | null {
  if (als) return als;

  if (typeof process === "undefined" || process.release?.name !== "node") {
    return null;
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { AsyncLocalStorage } = require("node:async_hooks") as {
      AsyncLocalStorage: new () => AsyncLocalStorageLike;
    };
    als = new AsyncLocalStorage();
    return als;
  } catch {
    return null;
  }
}

export function isRequestScopeSupported(): boolean {
  return getALS() !== null;
}

export function getActiveScope(): object | undefined {
  return getALS()?.getStore();
}

export function runWithActiveScope<T>(scope: object, fn: () => T): T {
  const storage = getALS();
  if (!storage) return fn();
  return storage.run(scope, fn);
}

export async function runWithActiveScopeAsync<T>(
  scope: object,
  fn: () => Promise<T>,
): Promise<T> {
  const storage = getALS();
  if (!storage) return fn();
  return storage.run(scope, fn);
}
