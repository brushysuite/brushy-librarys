import { containerRegistry } from "..";
import { Container } from "../../core/container";
import { Token } from "../@types";

/**
 * Utilities for dependency injection in any context (client or server).
 * Provides methods to manage and interact with the global DI container.
 */
export const inject = {
  /**
   * Sets a container as the global container for the application.
   *
   * @param container - The container to be used as default
   * @param options - Configuration options
   * @param options.autoCleanRequestScope - When true, automatically cleans request scope in Node.js environment
   *
   * @example
   * ```ts
   * const container = new Container();
   * inject.setGlobalContainer(container, { autoCleanRequestScope: true });
   * ```
   */
  setGlobalContainer: (
    container: Container,
    options: {
      autoCleanRequestScope?: boolean;
    } = {},
  ): void => {
    containerRegistry.setDefaultContainer(container);
    if (options.autoCleanRequestScope) {
      if (typeof process !== "undefined" && process.release?.name === "node") {
        process.on("beforeExit", () => {
          container.clearRequestScope();
        });
      }
    }
  },

  /**
   * Gets the global container of the application.
   *
   * @returns The global container instance
   * @throws Error if no global container has been defined
   *
   * @example
   * ```ts
   * const container = inject.getGlobalContainer();
   * ```
   */
  getGlobalContainer: (): Container => {
    if (!containerRegistry.hasDefaultContainer()) {
      throw new Error(
        "No global container defined. Use inject.setGlobalContainer() first.",
      );
    }
    return containerRegistry.getContainer();
  },

  /**
   * Resolves a dependency directly from the global container.
   *
   * @param token - The token of the dependency to be resolved
   * @returns The resolved dependency
   * @template T - The type of the dependency to resolve
   *
   * @example
   * ```ts
   * const service = inject.resolve<UserService>('USER_SERVICE');
   * ```
   */
  resolve: <T>(token: Token): T => {
    return inject.getGlobalContainer().resolve<T>(token);
  },

  /**
   * Resolves a dependency asynchronously from the global container.
   *
   * @param token - The token of the dependency to be resolved
   * @returns Promise with the resolved dependency
   * @template T - The type of the dependency to resolve
   *
   * @example
   * ```ts
   * const service = await inject.resolveAsync<DatabaseService>('DB_SERVICE');
   * ```
   */
  resolveAsync: <T>(token: Token): Promise<T> => {
    return inject.getGlobalContainer().resolveAsync<T>(token);
  },

  /**
   * Clears the request scope of the global container.
   * Useful to be called at the end of each HTTP request to prevent memory leaks.
   *
   * @example
   * ```ts
   * // At the end of a request
   * inject.clearRequestScope();
   * ```
   */
  clearRequestScope: (): void => {
    inject.getGlobalContainer().clearRequestScope();
  },
};
