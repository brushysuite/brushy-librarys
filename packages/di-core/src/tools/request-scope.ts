import type { Container } from "../core/container";
import {
  isRequestScopeSupported,
  runWithActiveScope,
  runWithActiveScopeAsync,
} from "./request-scope-store";

export { isRequestScopeSupported, getActiveScope } from "./request-scope-store";

function getDefaultContainer(): Container | undefined {
  try {
    // Lazy import evita dependência circular com registry.ts
    const { containerRegistry } = require("../registry") as typeof import("../registry");
    return containerRegistry.getContainer();
  } catch {
    return undefined;
  }
}

export interface RequestScopeOptions {
  scope?: object;
  container?: Container;
  onEnter?: (scope: object) => void;
  onCleanup?: () => void;
  skipRequestScopeCleanup?: boolean;
}

function cleanupRequestScope(options: RequestScopeOptions): void {
  if (options.skipRequestScopeCleanup) return;

  if (options.onCleanup) {
    options.onCleanup();
    return;
  }

  const container = options.container ?? getDefaultContainer();
  if (container) container.clearRequestScope();
}

function createScope(scope?: object): object {
  return scope ?? { brushyRequestId: `${Date.now()}-${Math.random()}` };
}

export function runInRequestScope<T>(
  fn: () => T,
  options: RequestScopeOptions = {},
): T {
  const useAls =
    isRequestScopeSupported() &&
    (options.scope !== undefined || options.container === undefined);

  if (!useAls) {
    try {
      return fn();
    } finally {
      cleanupRequestScope(options);
    }
  }

  const scope = createScope(options.scope);
  options.onEnter?.(scope);

  return runWithActiveScope(scope, () => {
    try {
      return fn();
    } finally {
      cleanupRequestScope(options);
    }
  });
}

export async function runInRequestScopeAsync<T>(
  fn: () => Promise<T>,
  options: RequestScopeOptions = {},
): Promise<T> {
  const useAls =
    isRequestScopeSupported() &&
    (options.scope !== undefined || options.container === undefined);

  if (!useAls) {
    try {
      return await fn();
    } finally {
      cleanupRequestScope(options);
    }
  }

  const scope = createScope(options.scope);
  options.onEnter?.(scope);

  return runWithActiveScopeAsync(scope, async () => {
    try {
      return await fn();
    } finally {
      cleanupRequestScope(options);
    }
  });
}

export interface BrushyRequestScopeOptions {
  container?: Container;
  onCleanup?: (container: Container) => void;
}

type MiddlewareReq = { on?: (event: string, fn: () => void) => void };
type MiddlewareRes = { on?: (event: string, fn: () => void) => void };
type MiddlewareNext = (error?: unknown) => void;

export function brushyRequestScope(
  options: BrushyRequestScopeOptions = {},
): (req: MiddlewareReq, res: MiddlewareRes, next: MiddlewareNext) => void {
  return (_req, res, next) => {
    if (!isRequestScopeSupported()) {
      next();
      return;
    }

    const scope = createScope();

    runWithActiveScope(scope, () => {
      const cleanup = () => {
        const container = options.container;
        if (!container) return;
        if (options.onCleanup) options.onCleanup(container);
        else container.clearRequestScope();
      };

      if (res.on) {
        res.on("finish", cleanup);
        res.on("close", cleanup);
      }

      next();
    });
  };
}
