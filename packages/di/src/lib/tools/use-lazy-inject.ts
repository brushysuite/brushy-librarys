import { useState, useCallback } from "react";
import { useInject } from "./use-inject";
import { InjectOptions, Token } from "../@types";

/**
 * React hook for lazy injection of dependencies into components.
 * The dependency will only be loaded when explicitly requested through the load function.
 * Useful for optimizing performance by deferring dependency resolution.
 *
 * @param token - The token representing the dependency to be injected
 * @param options - Options for configuring the injection behavior
 * @param options.scope - Optional scope for resolving the dependency
 * @returns A tuple containing:
 * - The dependency instance (undefined until loaded)
 * - A function to trigger the dependency loading
 * @template T - The type of the dependency to inject
 *
 * @example
 * ```tsx
 * // Basic usage
 * const [heavyService, loadService] = useLazyInject<HeavyService>('HEAVY_SERVICE');
 *
 * // Load on button click
 * const handleClick = () => {
 *   loadService();
 *   heavyService?.processData();
 * };
 *
 * // With scope
 * const [scopedService, loadScoped] = useLazyInject<ScopedService>(
 *   'SCOPED_SERVICE',
 *   { scope: requestScope }
 * );
 * ```
 */
export const useLazyInject = <T>(
  token: Token,
  options?: InjectOptions,
): [T | undefined, () => void] => {
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
};
