import { containerRegistry } from "../registry";
import type { Token } from "../types";
import type { InjectionToken } from "../types/tokens";

export function resolve<T>(token: InjectionToken<T>, scope?: object): T;
export function resolve<C extends abstract new (...args: any[]) => any>(
  token: C,
  scope?: object,
): InstanceType<C>;
export function resolve<T>(token: Token, scope?: object): T;
export function resolve<T>(token: Token, scope?: object): T {
  return containerRegistry.getContainer(scope).resolve<T>(token);
}
