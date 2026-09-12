import type { InjectionToken, InjectOptions, Token } from "@brushy/di-core";
import { DependencyError } from "@brushy/di-core";
import { useMemo, useRef } from "react";
import { useDIContainer } from "./context";

export function useInjectLazy<T extends object>(
  token: InjectionToken<T>,
  options?: InjectOptions,
): T;
export function useInjectLazy<C extends abstract new (...args: any[]) => object>(
  token: C,
  options?: InjectOptions,
): InstanceType<C>;
export function useInjectLazy<T extends object>(token: Token, options?: InjectOptions): T;
export function useInjectLazy<T extends object>(token: Token, options?: InjectOptions): T {
  if (!token) {
    throw new DependencyError("Token is required for lazy injection");
  }

  const container = useDIContainer(options?.scope);
  const instanceRef = useRef<T | null>(null);

  return useMemo(
    () =>
      new Proxy({} as T, {
        get(_target, prop) {
          try {
            if (!instanceRef.current) {
              instanceRef.current = container.resolve<T>(token);
            }

            const instance = instanceRef.current;
            if (!instance || typeof instance !== "object") {
              throw new DependencyError(
                `Invalid service instance. Expected object, got ${typeof instance}`,
              );
            }

            if (!(prop in instance)) {
              throw new DependencyError(
                `Method or property "${String(prop)}" not found in service`,
              );
            }

            return instance[prop as keyof T];
          } catch (error) {
            if (error instanceof DependencyError) throw error;
            throw new DependencyError(
              `Failed to resolve lazy service: ${
                error instanceof Error ? error.message : String(error)
              }`,
            );
          }
        },
      }),
    [container, token],
  );
}
