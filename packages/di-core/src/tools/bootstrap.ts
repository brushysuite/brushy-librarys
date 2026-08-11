import { Container } from "../core/container";
import { IS_DEV } from "../core/constants";
import { ProviderConfig } from "../types";
import { defineModule } from "./module";
import { enableBrushyDebug } from "./debug";

export function createBrushyApp<const T extends Record<string, ProviderConfig>>(
  providers: T,
) {
  const container = new Container();
  const module = defineModule(providers);
  module.register(container);

  if (IS_DEV) enableBrushyDebug(container);

  return { container, module };
}
