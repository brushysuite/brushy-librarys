import { Container } from "../core/container";
import { ProviderConfig } from "../types";
import {
  createToken,
  InferProviderType,
  InjectionToken,
} from "../types/tokens";

type ModuleProviders = Record<string, ProviderConfig>;

type ModuleServiceMap<T extends ModuleProviders> = {
  [K in keyof T]: InferProviderType<T[K]>;
};

type ModuleTokens<T extends ModuleProviders> = {
  [K in keyof T]: InjectionToken<ModuleServiceMap<T>[K]>;
};

export interface DefinedModule<T extends ModuleProviders> {
  tokens: ModuleTokens<T>;
  types: ModuleServiceMap<T>;
  register(container: Container): void;
}

export function defineModule<const T extends ModuleProviders>(
  providers: T,
): DefinedModule<T> {
  type ServiceMap = ModuleServiceMap<T>;
  const tokens = {} as ModuleTokens<T>;

  for (const key of Object.keys(providers) as (keyof T)[]) {
    tokens[key] = createToken<ServiceMap[typeof key]>(String(key));
  }

  return {
    tokens,
    types: {} as ServiceMap,
    register(container: Container) {
      for (const key of Object.keys(providers) as (keyof T)[]) {
        container.register(tokens[key], providers[key]);
      }
    },
  };
}
