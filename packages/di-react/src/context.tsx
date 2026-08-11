import { createContext, useContext } from "react";
import {
  Container,
  containerRegistry,
  DependencyError,
  ROOT_SCOPE,
} from "@brushy/di-core";

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

export const registerReactContainer = (
  scope: object,
  container: Container,
): void => {
  containerRegistry.registerContainer(scope, container);
  if (!containerRegistry.hasDefaultContainer()) {
    containerRegistry.setDefaultContainer(container);
  }
};

export { ROOT_SCOPE };
