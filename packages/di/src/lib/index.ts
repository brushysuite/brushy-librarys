import { PromiseCacheSystem } from "../core/promise-cache-system";
import { ContainerRegistry } from "../core/container-registry";

export const containerRegistry = new ContainerRegistry();
export const promiseCacheSystem = new PromiseCacheSystem();
