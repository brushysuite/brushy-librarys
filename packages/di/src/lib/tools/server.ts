import { Container } from "../../core/container";
import { Token } from "../@types";

// Container singleton para o servidor
let serverContainer: Container | null = null;

/**
 * Utilities for managing containers on the server side.
 * Provides methods to handle dependency injection specifically in server environments.
 */
export const server = {
  /**
   * Sets a container as the global server container.
   * This container will be used as the default container for server-side operations.
   *
   * @param container - The container to be used as the default on the server
   *
   * @example
   * ```ts
   * const serverContainer = new Container();
   * server.setServerContainer(serverContainer);
   * ```
   */
  setServerContainer: (container: Container): void => {
    serverContainer = container;
  },

  /**
   * Gets the global server container.
   *
   * @returns The global server container
   * @throws Error if no server container has been defined
   *
   * @example
   * ```ts
   * const container = server.getServerContainer();
   * ```
   */
  getServerContainer: (): Container => {
    if (!serverContainer) {
      throw new Error(
        "No server container defined. Use server.setServerContainer() first.",
      );
    }
    return serverContainer;
  },

  /**
   * Resolves a dependency directly from the server container.
   *
   * @param token - The token of the dependency to be resolved
   * @returns The resolved dependency
   * @template T - The type of the dependency to resolve
   *
   * @example
   * ```ts
   * const dbService = server.resolve<DatabaseService>('DB_SERVICE');
   * ```
   */
  resolve: <T>(token: Token): T => {
    return server.getServerContainer().resolve<T>(token);
  },

  /**
   * Resolves a dependency asynchronously from the server container.
   *
   * @param token - The token of the dependency to be resolved
   * @returns Promise with the resolved dependency
   * @template T - The type of the dependency to resolve
   *
   * @example
   * ```ts
   * const service = await server.resolveAsync<AsyncService>('ASYNC_SERVICE');
   * ```
   */
  resolveAsync: <T>(token: Token): Promise<T> => {
    return server.getServerContainer().resolveAsync<T>(token);
  },

  /**
   * Clears the request scope of the server container.
   * Should be called at the end of each HTTP request to prevent memory leaks.
   *
   * @example
   * ```ts
   * // At the end of a request handler
   * server.clearRequestScope();
   * ```
   */
  clearRequestScope: (): void => {
    server.getServerContainer().clearRequestScope();
  },
};
