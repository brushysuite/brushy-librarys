import { useMemo } from "react";
import { Container } from "@brushy/di-core";
import { DIContext, registerReactContainer, ROOT_SCOPE } from "./context";

export const BrushyDIProvider: React.FC<{
  container: Container;
  children: React.ReactNode;
  scope?: object;
}> = ({ container, children, scope = ROOT_SCOPE }) => {
  const value = useMemo(() => {
    registerReactContainer(scope, container);
    return container;
  }, [container, scope]);

  return <DIContext.Provider value={value}>{children}</DIContext.Provider>;
};
