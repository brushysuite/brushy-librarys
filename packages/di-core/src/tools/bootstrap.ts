import { IS_DEV } from "../core/constants";
import { Container } from "../core/container";
import type { ProviderConfig } from "../types";
import { enableBrushyDebug } from "./debug";
import { defineModule } from "./module";

export function createBrushyApp<const T extends Record<string, ProviderConfig>>(providers: T) {
  const container = new Container();
  const module = defineModule(providers);
  module.register(container);

  if (IS_DEV) enableBrushyDebug(container);

  return { container, module };
}
