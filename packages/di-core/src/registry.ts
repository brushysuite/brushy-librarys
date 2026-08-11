import { ContainerRegistry } from "./core/container-registry";
import { PromiseCache } from "./core/promise-cache";

export const containerRegistry = new ContainerRegistry();
export const promiseCache = new PromiseCache();

/** @deprecated Use promiseCache */
export class PromiseCacheSystem extends PromiseCache {}

/** @deprecated Use promiseCache */
export const promiseCacheSystem = promiseCache;
