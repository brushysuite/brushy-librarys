import { Container } from "../core/container";
import { Token } from "../types";
import type { InjectionToken } from "../types/tokens";

let serverContainer: Container | null = null;

interface ServerAPI {
  setServerContainer(container: Container): void;
  getServerContainer(): Container;
  resolve<T>(token: InjectionToken<T>): T;
  resolve<C extends abstract new (...args: any[]) => any>(token: C): InstanceType<C>;
  resolve<T>(token: Token): T;
  resolveAsync<T>(token: InjectionToken<T>): Promise<T>;
  resolveAsync<C extends abstract new (...args: any[]) => any>(
    token: C,
  ): Promise<InstanceType<C>>;
  resolveAsync<T>(token: Token): Promise<T>;
  clearRequestScope(): void;
}

export const server: ServerAPI = {
  setServerContainer: (container: Container): void => {
    serverContainer = container;
  },

  getServerContainer: (): Container => {
    if (!serverContainer) {
      throw new Error(
        "No server container defined. Use server.setServerContainer() first.",
      );
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
};
