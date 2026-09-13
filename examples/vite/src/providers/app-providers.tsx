import { BrushyDIProvider } from "@brushy/di-react";
import type { ReactNode } from "react";
import { container } from "../app/container";
import { StorageBridge } from "./storage-bridge";

type AppProvidersProps = {
  children: ReactNode;
};

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <BrushyDIProvider container={container}>
      <StorageBridge>{children}</StorageBridge>
    </BrushyDIProvider>
  );
}
