import type { Container } from "../core/container";
import type { Token } from "../types";
import type { InjectionToken } from "../types/tokens";
import {
  type BrushyRequestScopeOptions,
  brushyRequestScope as createBrushyRequestScope,
} from "./request-scope";

let serverContainer: Container | null = null;

type MiddlewareHandler = (
  req: { on?: (event: string, fn: () => void) => void },
  res: { on?: (event: string, fn: () => void) => void },
  next: (error?: unknown) => void,
) => void;

interface ServerAPI {
  setServerContainer(container: Container): void;
  getServerContainer(): Container;
  resolve<T>(token: InjectionToken<T>): T;
  resolve<C extends abstract new (...args: any[]) => any>(token: C): InstanceType<C>;
  resolve<T>(token: Token): T;
  resolveAsync<T>(token: InjectionToken<T>): Promise<T>;
  resolveAsync<C extends abstract new (...args: any[]) => any>(token: C): Promise<InstanceType<C>>;
  resolveAsync<T>(token: Token): Promise<T>;
  clearRequestScope(): void;
  brushyRequestScope(options?: Omit<BrushyRequestScopeOptions, "container">): MiddlewareHandler;
}

export const server: ServerAPI = {
  setServerContainer: (container: Container): void => {
    serverContainer = container;
  },

  getServerContainer: (): Container => {
    if (!serverContainer) {
      throw new Error("No server container defined. Use server.setServerContainer() first.");
    }
    return serverContainer;
  },

  resolve: <T>(token: Token): T => {
    return server.getServerContainer().resolve<T>(token);
  },

  resolveAsync: <T>(token: Token): Promise<T> => {
    return server.getServerContainer().resolveAsync<T>(token);
  },

  clearRequestScope: (): void => {
    server.getServerContainer().clearRequestScope();
  },

  brushyRequestScope: (
    options: Omit<BrushyRequestScopeOptions, "container"> = {},
  ): MiddlewareHandler => {
    return createBrushyRequestScope({
      ...options,
      container: server.getServerContainer(),
    });
  },
};
