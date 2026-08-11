import { containerRegistry } from "../registry";
import { Container } from "../core/container";
import { Token } from "../types";
import type { InjectionToken } from "../types/tokens";

interface InjectAPI {
  setGlobalContainer(
    container: Container,
    options?: { autoCleanRequestScope?: boolean },
  ): void;
  getGlobalContainer(): Container;
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

export const inject: InjectAPI = {
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
