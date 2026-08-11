import { containerRegistry } from "../registry";
import { Token } from "../types";

export const resolve = <T>(token: Token, scope?: object): T => {
  return containerRegistry.getContainer(scope).resolve<T>(token);
};
