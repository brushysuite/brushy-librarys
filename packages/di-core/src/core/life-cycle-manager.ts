import type { DependencyResolver } from "./dependency-resolver";
import { GarbageCollector } from "./garbage-collector";

export class LifecycleManager {
  private garbageCollector: GarbageCollector | null = null;

  constructor(private readonly resolver: DependencyResolver) {}

  startGarbageCollector(ttl = 60000, interval = 30000): void {
    if (!this.garbageCollector) {
      this.garbageCollector = new GarbageCollector(this.resolver);
    }
    this.garbageCollector.start(ttl, interval);
  }

  stopGarbageCollector(): void {
    this.garbageCollector?.stop();
  }
}
