import { useMemo } from "react";
import { promiseCache, DependencyError } from "@brushy/di-core";
import type { InjectOptions, Token } from "@brushy/di-core";
import type { InjectionToken } from "@brushy/di-core";
import { useDIContainer } from "./context";

const isThenable = (value: unknown): value is Promise<unknown> =>
  !!value &&
  (value instanceof Promise ||
    (typeof (value as Promise<unknown>).then === "function"));

export function useInject<T>(
  token: InjectionToken<T>,
  options?: InjectOptions,
): T;
export function useInject<C extends abstract new (...args: any[]) => any>(
  token: C,
  options?: InjectOptions,
): InstanceType<C>;
export function useInject<T>(token: Token, options?: InjectOptions): T;
export function useInject<T>(token: Token, options?: InjectOptions): T {
  const container = useDIContainer(options?.scope);

  const service = useMemo(
    () => container.resolve<T>(token),
    [container, token],
  );

  const shouldCache = options?.cachePromises !== false;
  if (
    !shouldCache ||
    (typeof service !== "object" && typeof service !== "function") ||
    service === null
  ) {
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
}
