import { type Container, containerRegistry, DependencyError } from "@brushy/di-core";
import { createContext, useContext } from "react";

export { ROOT_SCOPE } from "@brushy/di-core";

export const DIContext = createContext<Container | null>(null);

export const useDIContainer = (scope?: object): Container => {
  const fromContext = useContext(DIContext);
  if (fromContext) return fromContext;

  try {
    return containerRegistry.getContainer(scope);
  } catch (error) {
    throw new DependencyError(
      `Unable to find a container for injection. Make sure your application is wrapped by a BrushyDIProvider. Original error: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
};

/**
 * Explicit bridge for non-React code / legacy request scopes.
 * Registers the container in the global registry outside the React render cycle.
 * Returns a cleanup function that must be called manually.
 *
 * Normal React apps do not need this; use BrushyDIProvider instead.
 */
export const bridgeContainer = (scope: object, container: Container): (() => void) => {
  containerRegistry.registerContainer(scope, container);
  if (!containerRegistry.hasDefaultContainer()) {
    containerRegistry.setDefaultContainer(container);
  }

  return () => {
    containerRegistry.unregisterContainer(scope);
  };
};

/**
 * @deprecated Use `bridgeContainer` for explicit registry integration.
 * Kept for backwards compatibility with existing test setups.
 */
export const registerReactContainer = (scope: object, container: Container): void => {
  containerRegistry.registerContainer(scope, container);
  if (!containerRegistry.hasDefaultContainer()) {
    containerRegistry.setDefaultContainer(container);
  }
};

/**
 * @deprecated Use the cleanup returned by `bridgeContainer`.
 */
export const unregisterReactContainer = (scope: object): void => {
  containerRegistry.unregisterContainer(scope);
};
