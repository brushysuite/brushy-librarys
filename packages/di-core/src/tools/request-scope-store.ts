type AsyncLocalStorageLike = {
  run: <T>(store: object, fn: () => T) => T;
  getStore: () => object | undefined;
};

function initALS(): AsyncLocalStorageLike | null {
  if (typeof process === "undefined" || process.release?.name !== "node") {
    return null;
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { AsyncLocalStorage } = require("node:async_hooks") as {
      AsyncLocalStorage: new () => AsyncLocalStorageLike;
    };
    return new AsyncLocalStorage();
  } catch {
    return null;
  }
}

const als: AsyncLocalStorageLike | null = initALS();

export function isRequestScopeSupported(): boolean {
  return als !== null;
}

export function getActiveScope(): object | undefined {
  return als?.getStore();
}

export function runWithActiveScope<T>(scope: object, fn: () => T): T {
  if (!als) return fn();
  return als.run(scope, fn);
}

export async function runWithActiveScopeAsync<T>(scope: object, fn: () => Promise<T>): Promise<T> {
  if (!als) return fn();
  return als.run(scope, fn);
}
