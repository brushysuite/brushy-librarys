import { containerRegistry } from "..";
import { Token } from "../@types";

/**
 * Utility function to resolve dependencies from the container.
 * Provides a simpler way to resolve dependencies without managing container instances directly.
 *
 * @param token - The token representing the dependency to resolve
 * @param scope - Optional scope to use for resolving the dependency
 * @returns The resolved dependency
 * @template T - The type of the dependency to resolve
 *
 * @example
 * ```ts
 * // Simple resolve
 * const userService = resolve<UserService>('USER_SERVICE');
 *
 * // Resolve with scope
 * const scopedService = resolve<ScopedService>('SCOPED_SERVICE', requestScope);
 * ```
 */
export const resolve = <T>(token: Token, scope?: object): T => {
  return containerRegistry.getContainer(scope).resolve<T>(token);
};
