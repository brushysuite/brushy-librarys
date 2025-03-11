import { Logger } from "./logger";
import { DependencyResolver } from "./dependency-resolver";
import { InstanceWrapper, Token } from "../lib/@types";

// Classe para gerenciar a limpeza de instâncias não utilizadas
export class GarbageCollector {
  private gcTimer: ReturnType<typeof setInterval> | null = null;

  constructor(private resolver: DependencyResolver) {}

  start(ttl: number, interval: number) {
    if (this.gcTimer) clearInterval(this.gcTimer);
    Logger.info(
      `Starting garbage collector: TTL=${ttl}ms, Interval=${interval}ms`,
    );
    this.gcTimer = setInterval(() => {
      const now = Date.now();
      Array.from(this.resolver.getInstances()).forEach(
        ([token, wrapper]: [Token, InstanceWrapper]) => {
          if (now - wrapper.lastUsed > ttl) {
            Logger.info(
              `Garbage collecting instance for token: ${String(token)}`,
            );
            this.resolver.deleteInstance(token);
          }
        },
      );
    }, interval);
  }

  stop() {
    if (this.gcTimer) {
      clearInterval(this.gcTimer);
      this.gcTimer = null;
      Logger.info("Garbage collector stopped.");
    }
  }
}
