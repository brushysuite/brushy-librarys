import { useState, useCallback } from "react";
import { useInject } from "./use-inject";
import { InjectOptions, Token } from "../@types";
import { DependencyError } from "../../core/dependency-error";

/**
 * Creates a lazy object that only resolves the value when accessed
 */
function lazy<T extends object>(getter: () => T): T {
  let instance: T | undefined;

  const handler: ProxyHandler<T> = {
    get(target: T, prop: string | symbol) {
      try {
        if (!instance) {
          instance = getter();

          if (!instance || typeof instance !== "object") {
            throw new DependencyError(
              `Invalid service instance. Expected object, got ${typeof instance}`,
            );
          }

          Object.defineProperty(target, "__instance", {
            value: instance,
            writable: false,
            configurable: false,
          });
        }

        if (!(prop in instance)) {
          throw new DependencyError(
            `Method or property "${String(prop)}" not found in service`,
          );
        }

        return instance[prop as keyof T];
      } catch (error) {
        throw new DependencyError(
          `Failed to resolve lazy service: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
      }
    },
  };

  return new Proxy({} as T, handler);
}

/**
 * New version of the hook using the lazy pattern with proxy
 * @example
 * const userService = useInjectLazy<UserService>('USER_SERVICE');
 * userService.getUsers(); // Resolves only when the method is called
 */
export function useInjectLazy<T extends object>(
  token: Token,
  options?: InjectOptions,
): T {
  if (!token) {
    throw new DependencyError("Token is required for lazy injection");
  }

  return lazy(() =>
    useInject<T>(token, {
      ...options,
      cachePromises: false,
    }),
  );
}

/**
 * @deprecated Use useInjectLazy instead.
 * This version will be removed in future versions.
 * @example
 * // Old way:
 * const [service, load] = useLazyInject<UserService>('USER_SERVICE');
 *
 * // Recommended new way:
 * const service = useInjectLazy<UserService>('USER_SERVICE');
 * service.getUsers();
 */
export function useLazyInject<T>(
  token: Token,
  options?: InjectOptions,
): [T | undefined, () => void] {
  const [isLoaded, setIsLoaded] = useState(false);
  const [instance, setInstance] = useState<T | undefined>(undefined);

  const service = useInject<T>(token, {
    ...options,
    cachePromises: false,
  });

  const load = useCallback(() => {
    if (!isLoaded) {
      setInstance(service);
      setIsLoaded(true);
    }
  }, [service, isLoaded]);

  return [instance, load];
}
