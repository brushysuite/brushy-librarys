import { BrushyDIProvider } from "@brushy/di-react";
import type { FC, ReactNode } from "react";
import { container } from "../container";
import "./inject-component-error";
import { StorageBridge } from "./storage-bridge";

type AppProvidersProps = {
  children: ReactNode;
};

const Provider = BrushyDIProvider as FC<{
  container: typeof container;
  children: ReactNode;
}>;

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <Provider container={container}>
      <StorageBridge>{children}</StorageBridge>
    </Provider>
  );
}
