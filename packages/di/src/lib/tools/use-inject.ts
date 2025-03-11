import { useMemo } from "react";
import { containerRegistry, promiseCacheSystem } from "..";
import { InjectOptions, Token } from "../@types";
import { DependencyError } from "../../core/dependency-error";
import { Container } from "../../core/container";

/**
 * React hook for injecting dependencies into components.
 * Provides a way to access dependencies from the DI container with automatic promise caching.
 *
 * @param token - The token representing the dependency to inject
 * @param options - Options for configuring the injection behavior
 * @param options.cachePromises - Whether to cache promises returned by methods (default: true)
 * @param options.scope - Optional scope for resolving the dependency
 * @returns The injected dependency
 * @template T - The type of the dependency to inject
 * @throws {DependencyError} If no container is found or injection fails
 *
 * @example
 * ```tsx
 * // Basic usage
 * const userService = useInject<UserService>('USER_SERVICE');
 *
 * // With options
 * const dbService = useInject<DatabaseService>('DB_SERVICE', {
 *   cachePromises: false,
 *   scope: requestScope
 * });
 *
 * // Using the injected service
 * const users = await userService.getUsers();
 * ```
 */
export const useInject = <T>(token: Token, options?: InjectOptions): T => {
  let container: Container;
  try {
    container = containerRegistry.getContainer(options?.scope);
  } catch (error) {
    throw new DependencyError(
      `Unable to find a container for injection. Make sure your application is wrapped by a BrushyDIProvider. Original error: ${error instanceof Error ? error.message : String(error)}`,
    );
  }

  const service = useMemo(
    () => container.resolve<any>(token),
    [container, token],
  );
  const tokenStr = useMemo(() => String(token), [token]);
  const shouldCache = useMemo(
    () => options?.cachePromises !== false,
    [options],
  );

  if (typeof service !== "object" || service === null) {
    return service as T;
  }

  return useMemo(
    () =>
      new Proxy(service, {
        get: (target, prop) => {
          const original = target[prop];

          if (typeof original !== "function") {
            return original;
          }

          return (...args: any[]) => {
            if (!shouldCache) {
              return original.apply(target, args);
            }

            const methodName = String(prop);
            const cacheKey = promiseCacheSystem.createCacheKey(
              tokenStr,
              methodName,
              args,
            );

            if (
              promiseCacheSystem.getCachedPromise(cacheKey) &&
              promiseCacheSystem.isCacheValid(cacheKey)
            ) {
              return promiseCacheSystem.getCachedPromise(cacheKey);
            }

            const result = original.apply(target, args);

            if (
              result instanceof Promise ||
              (result && typeof result.then === "function")
            ) {
              promiseCacheSystem.setCachedPromise(cacheKey, result);
            }

            return result;
          };
        },
      }) as T,
    [service, tokenStr, shouldCache],
  );
};
