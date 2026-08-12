export type { BrushyDIProviderProps } from "./provider";
export { BrushyDIProvider } from "./provider";
export {
  useDIContainer,
  bridgeContainer,
  registerReactContainer,
  unregisterReactContainer,
  ROOT_SCOPE,
  DIContext,
} from "./context";
export { useInject } from "./use-inject";
export { useInjectLazy } from "./use-lazy-inject";
export {
  useInjectComponent,
  registerComponent,
  registerComponents,
  createComponentsProvider,
  renderErrorUI,
  setInjectComponentErrorRenderer,
  handleComponentNotFound,
  handleResolveError,
} from "./inject-component";

export type { InjectComponentErrorRenderer } from "./inject-component";

export type { InjectOptions } from "@brushy/di-core";
