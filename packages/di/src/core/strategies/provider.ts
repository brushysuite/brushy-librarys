import { ProviderConfig, Token } from "../../lib/@types";
import { DependencyError } from "../dependency-error";

export type ResolveFn = (token: Token) => unknown;

export interface ProviderStrategy {
  match(config: ProviderConfig): boolean;
  create<T>(config: ProviderConfig, resolve: ResolveFn): T;
}

const valueStrategy: ProviderStrategy = {
  match: (config) => config.useValue !== undefined,
  create: (config) => config.useValue,
};

const factoryStrategy: ProviderStrategy = {
  match: (config) => typeof config.useFactory === "function",
  create(config, resolve) {
    const deps = resolveDependencies(config, resolve);
    return config.useFactory!(...deps);
  },
};

const classStrategy: ProviderStrategy = {
  match: (config) => typeof config.useClass === "function",
  create(config, resolve) {
    const ClassRef = config.useClass!;
    const deps = resolveDependencies(config, resolve);
    return deps.length ? new ClassRef(...deps) : new ClassRef();
  },
};

const resolveDependencies = (
  config: ProviderConfig,
  resolve: ResolveFn,
): unknown[] => {
  if (!config.dependencies?.length) return [];
  return config.dependencies.map((dep) => resolve(dep));
};

export const PROVIDER_STRATEGIES: ProviderStrategy[] = [
  valueStrategy,
  factoryStrategy,
  classStrategy,
];

export const createFromProvider = <T>(
  config: ProviderConfig,
  resolve: ResolveFn,
): T => {
  for (const strategy of PROVIDER_STRATEGIES) {
    if (!strategy.match(config)) continue;
    return strategy.create<T>(config, resolve);
  }

  throw new DependencyError("Invalid provider config.");
};
