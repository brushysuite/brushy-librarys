import { useMemo } from "react";
import { containerRegistry } from "..";
import { Container } from "../../core/container";
import { DIContext, ROOT_SCOPE } from "../context";

/**
 * Provides a DI container to React and React Native trees — no useEffect.
 */
export const BrushyDIProvider: React.FC<{
  container: Container;
  children: React.ReactNode;
  scope?: object;
}> = ({ container, children, scope = ROOT_SCOPE }) => {
  const value = useMemo(() => {
    containerRegistry.registerContainer(scope, container);
    if (!containerRegistry.hasDefaultContainer()) {
      containerRegistry.setDefaultContainer(container);
    }
    return container;
  }, [container, scope]);

  return <DIContext.Provider value={value}>{children}</DIContext.Provider>;
};
