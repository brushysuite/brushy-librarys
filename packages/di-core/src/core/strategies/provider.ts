import { ProviderConfig, Token } from "../../types";
import { compileCreator } from "../compiled-creator";
import { DependencyError } from "../dependency-error";

export type ResolveFn = (token: Token) => unknown;

export const createFromProvider = <T>(
  config: ProviderConfig,
  resolve: ResolveFn,
  precompiled?: (resolve: ResolveFn) => unknown,
): T => {
  const creator = precompiled ?? compileCreator(config);
  if (creator) {
    return creator(resolve) as T;
  }

  if (config.useValue !== undefined) {
    return config.useValue as T;
  }

  throw new DependencyError("Invalid provider config.");
};
