import { GarbageCollector } from "./garbage-collector";
import { DependencyResolver } from "./dependency-resolver";

export class LifecycleManager {
  constructor(private resolver: DependencyResolver) {}

  startGarbageCollector(ttl: number = 60000, interval: number = 30000) {
    const gc = new GarbageCollector(this.resolver);
    gc.start(ttl, interval);
  }

  stopGarbageCollector() {
    const gc = new GarbageCollector(this.resolver);
    gc.stop();
  }
}
