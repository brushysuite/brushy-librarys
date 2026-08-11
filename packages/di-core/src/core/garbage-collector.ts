import { DependencyResolver } from "./dependency-resolver";
import { InstanceWrapper, Token } from "../types";
import { Logger } from "./logger";
import { IS_DEV } from "./constants";

export class GarbageCollector {
  private gcTimer: ReturnType<typeof setInterval> | null = null;

  constructor(private readonly resolver: DependencyResolver) {}

  start(ttl: number, interval: number): void {
    if (this.gcTimer) clearInterval(this.gcTimer);

    if (IS_DEV) {
      Logger.info(
        `Starting garbage collector: TTL=${ttl}ms, Interval=${interval}ms`,
      );
    }

    this.gcTimer = setInterval(() => {
      const now = Date.now();
      for (const [token, wrapper] of this.resolver.getInstances()) {
        if (now - (wrapper as InstanceWrapper).lastUsed <= ttl) continue;
        if (IS_DEV) {
          Logger.info(`Garbage collecting instance for token: ${String(token)}`);
        }
        this.resolver.deleteInstance(token);
      }
    }, interval);
  }

  stop(): void {
    if (!this.gcTimer) return;
    clearInterval(this.gcTimer);
    this.gcTimer = null;
    if (IS_DEV) Logger.info("Garbage collector stopped.");
  }
}
