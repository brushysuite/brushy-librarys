import type { ProviderConfig, Token } from "../types";

export type ResolveFn = (token: Token) => unknown;

export type CompiledCreator = (resolve: ResolveFn) => unknown;

function compileClassCreator(
  ClassRef: new (...args: unknown[]) => unknown,
  deps: readonly Token[],
): CompiledCreator {
  switch (deps.length) {
    case 0:
      return () => new ClassRef();
    case 1:
      return (resolve) => new ClassRef(resolve(deps[0]!));
    case 2:
      return (resolve) => new ClassRef(resolve(deps[0]!), resolve(deps[1]!));
    case 3:
      return (resolve) => new ClassRef(resolve(deps[0]!), resolve(deps[1]!), resolve(deps[2]!));
    case 4:
      return (resolve) =>
        new ClassRef(resolve(deps[0]!), resolve(deps[1]!), resolve(deps[2]!), resolve(deps[3]!));
    case 5:
      return (resolve) =>
        new ClassRef(
          resolve(deps[0]!),
          resolve(deps[1]!),
          resolve(deps[2]!),
          resolve(deps[3]!),
          resolve(deps[4]!),
        );
    default:
      return (resolve) => {
        const resolved = new Array<unknown>(deps.length);
        for (let i = 0; i < deps.length; i++) {
          resolved[i] = resolve(deps[i]!);
        }
        return new ClassRef(...resolved);
      };
  }
}

function compileFactoryCreator(
  factory: (...args: unknown[]) => unknown,
  deps: readonly Token[],
): CompiledCreator {
  switch (deps.length) {
    case 0:
      return () => factory();
    case 1:
      return (resolve) => factory(resolve(deps[0]!));
    case 2:
      return (resolve) => factory(resolve(deps[0]!), resolve(deps[1]!));
    case 3:
      return (resolve) => factory(resolve(deps[0]!), resolve(deps[1]!), resolve(deps[2]!));
    case 4:
      return (resolve) =>
        factory(resolve(deps[0]!), resolve(deps[1]!), resolve(deps[2]!), resolve(deps[3]!));
    case 5:
      return (resolve) =>
        factory(
          resolve(deps[0]!),
          resolve(deps[1]!),
          resolve(deps[2]!),
          resolve(deps[3]!),
          resolve(deps[4]!),
        );
    default:
      return (resolve) => {
        const resolved = new Array<unknown>(deps.length);
        for (let i = 0; i < deps.length; i++) {
          resolved[i] = resolve(deps[i]!);
        }
        return factory(...resolved);
      };
  }
}

export function compileCreator(config: ProviderConfig): CompiledCreator | undefined {
  if (config.useValue !== undefined) {
    const value = config.useValue;
    return () => value;
  }

  const deps = config.dependencies ?? [];

  if (typeof config.useFactory === "function") {
    return compileFactoryCreator(config.useFactory, deps);
  }

  if (typeof config.useClass === "function") {
    return compileClassCreator(config.useClass, deps);
  }

  return undefined;
}
