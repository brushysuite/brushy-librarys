import { Container } from "../core/container";
import { Token } from "../types";

let serverContainer: Container | null = null;

export const server = {
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
