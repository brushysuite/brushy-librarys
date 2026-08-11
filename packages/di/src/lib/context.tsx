import { createContext, useContext } from "react";
import { containerRegistry } from ".";
import { Container } from "../core/container";
import { ROOT_SCOPE } from "../core/container-registry";
import { DependencyError } from "../core/dependency-error";

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

export { ROOT_SCOPE };
