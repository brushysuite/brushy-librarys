import { useMemo } from "react";
import { promiseCache } from "..";
import { InjectOptions, Token } from "../@types";
import { DependencyError } from "../../core/dependency-error";
import { useDIContainer } from "../context";

const isThenable = (value: unknown): value is Promise<unknown> =>
  !!value &&
  (value instanceof Promise ||
    (typeof (value as Promise<unknown>).then === "function"));

/**
 * Injects a dependency — Proxy wrapping is opt-in via cachePromises.
 */
export const useInject = <T>(token: Token, options?: InjectOptions): T => {
  const container = useDIContainer(options?.scope);

  const service = useMemo(
    () => container.resolve<T>(token),
    [container, token],
  );

  const shouldCache = options?.cachePromises !== false;
  if (!shouldCache || (typeof service !== "object" && typeof service !== "function") || service === null) {
    return service;
  }

  const tokenKey = String(token);

  return useMemo(
    () =>
      new Proxy(service as object, {
        get(target, prop) {
          const original = Reflect.get(target, prop);
          if (typeof original !== "function") return original;

          return (...args: unknown[]) => {
            const methodName = String(prop);
            const cacheKey = promiseCache.createKey(tokenKey, methodName, args);
            const cached = promiseCache.get(cacheKey);
            if (cached) return cached;

            const result = original.apply(target, args);
            if (isThenable(result)) promiseCache.set(cacheKey, result);
            return result;
          };
        },
      }) as T,
    [service, tokenKey],
  );
};

export const useInjectWithContainer = <T>(
  token: Token,
  container: ReturnType<typeof useDIContainer>,
  options?: InjectOptions,
): T => {
  if (!container) {
    throw new DependencyError(
      "Unable to find a container for injection. Wrap your app with BrushyDIProvider.",
    );
  }

  return useInject<T>(token, { ...options, scope: undefined });
};
