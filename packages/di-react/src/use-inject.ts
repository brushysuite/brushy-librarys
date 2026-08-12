import { useRef } from "react";
import { Container, promiseCache, DependencyError } from "@brushy/di-core";
import type { InjectOptions, Token } from "@brushy/di-core";
import type { InjectionToken } from "@brushy/di-core";
import { useDIContainer } from "./context";

const isThenable = (value: unknown): value is Promise<unknown> =>
  !!value &&
  (value instanceof Promise ||
    typeof (value as Promise<unknown>).then === "function");

const shouldWrapProxy = (value: unknown): value is object | Function =>
  value !== null &&
  value !== undefined &&
  (typeof value === "object" || typeof value === "function");

const createPromiseProxy = <T>(
  service: T,
  tokenKey: string,
  shouldCache: boolean,
): T => {
  if (!shouldCache || !shouldWrapProxy(service)) {
    return service;
  }

  return new Proxy(service as object, {
    get(target, prop) {
      const original = Reflect.get(target, prop);
      if (typeof original !== "function") return original;

      return (...args: unknown[]) => {
        const methodName = String(prop);
        const cacheKey = promiseCache.createKey(tokenKey, methodName, args);
        const cached = promiseCache.get(cacheKey);
        if (cached) return cached;

        const result = original.apply(target, args);
        if (shouldCache && isThenable(result)) {
          promiseCache.set(cacheKey, result);
        }
        return result;
      };
    },
  }) as T;
};

interface UseInjectState<T> {
  container: Container;
  token: Token;
  service: T;
  proxy: T;
}

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
  const tokenKey = String(token);
  const shouldCache = options?.cachePromises !== false;

  const ref = useRef<UseInjectState<T> | null>(null);

  const stale =
    ref.current === null ||
    ref.current.container !== container ||
    ref.current.token !== token;

  if (stale) {
    const service = container.resolve<T>(token);
    ref.current = {
      container,
      token,
      service,
      proxy: createPromiseProxy(service, tokenKey, shouldCache),
    };
  }

  return ref.current!.proxy;
}
