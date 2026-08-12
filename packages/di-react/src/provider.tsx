import type { FC, ReactNode } from "react";
import type { Container } from "@brushy/di-core";
import { DIContext } from "./context";

export interface BrushyDIProviderProps {
  container: Container;
  children: ReactNode;
}

export const BrushyDIProvider: FC<BrushyDIProviderProps> = ({
  container,
  children,
}) => {
  return <DIContext.Provider value={container}>{children}</DIContext.Provider>;
};
