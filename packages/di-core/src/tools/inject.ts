import { containerRegistry } from "../registry";
import { Container } from "../core/container";
import { Token } from "../types";

export const inject = {
  setGlobalContainer: (
    container: Container,
    options: { autoCleanRequestScope?: boolean } = {},
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

  getGlobalContainer: (): Container => {
    if (!containerRegistry.hasDefaultContainer()) {
      throw new Error(
        "No global container defined. Use inject.setGlobalContainer() first.",
      );
    }
    return containerRegistry.getContainer();
  },

  resolve: <T>(token: Token): T => {
    return inject.getGlobalContainer().resolve<T>(token);
  },

  resolveAsync: <T>(token: Token): Promise<T> => {
    return inject.getGlobalContainer().resolveAsync<T>(token);
  },

  clearRequestScope: (): void => {
    inject.getGlobalContainer().clearRequestScope();
  },
};
