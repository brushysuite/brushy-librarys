import type { FC, ReactNode } from "react";
import { useMemo } from "react";
import { Container, type ProviderConfig } from "@brushy/di-core";
import type { DefinedModule } from "@brushy/di-core";
import { DIContext, registerReactContainer, ROOT_SCOPE } from "./context";

export const BrushyDIProvider: FC<{
  container: Container;
  children: ReactNode;
  scope?: object;
  module?: DefinedModule<Record<string, ProviderConfig>>;
}> = ({ container, children, scope = ROOT_SCOPE, module }) => {
  const value = useMemo(() => {
    if (module) module.register(container);
    registerReactContainer(scope, container);
    return container;
  }, [container, scope, module]);

  return <DIContext.Provider value={value}>{children}</DIContext.Provider>;
};
