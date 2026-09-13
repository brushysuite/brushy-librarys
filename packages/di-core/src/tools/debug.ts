import type { Container } from "../core/container";

export interface BrushyDebugAPI {
  container: Container;
  exportProviders: () => ReturnType<Container["exportProviders"]>;
  resolve: Container["resolve"];
}

export function enableBrushyDebug(container: Container): BrushyDebugAPI {
  const api: BrushyDebugAPI = {
    container,
    exportProviders: () => container.exportProviders(),
    resolve: container.resolve.bind(container),
  };

  (globalThis as { __BRUSHY_DI__?: BrushyDebugAPI }).__BRUSHY_DI__ = api;
  return api;
}

export function getBrushyDebug(): BrushyDebugAPI | null {
  return (globalThis as { __BRUSHY_DI__?: BrushyDebugAPI }).__BRUSHY_DI__ ?? null;
}
