import { consumeChecksum } from "../fixtures/checksum.js";
import {
  BATCH_COUNT,
  BenchService,
  Config,
  FactoryService,
  HubService,
  Logger,
  NodeA,
  NodeB,
  NodeC,
  NodeD,
  NodeE,
} from "../fixtures/classes.js";
import type { BenchAdapter, BenchScenario, ScenarioId } from "../types.js";

function buildDeepGraph(): NodeE {
  return new NodeE(new NodeD(new NodeC(new NodeB(new NodeA()))));
}

function buildWideGraph(): HubService {
  const a = new NodeA();
  const b = new NodeB(a);
  const c = new NodeC(b);
  const d = new NodeD(c);
  const e = new NodeE(d);
  return new HubService(a, b, c, d, e);
}

class BaselineScenario implements BenchScenario {
  private warmInstance: BenchService | null = null;
  private batchClasses: (new () => BenchService)[] = [];

  constructor(private readonly scenario: ScenarioId) {}

  setup(): void {
    this.teardown();

    switch (this.scenario) {
      case "singleton_warm":
        this.warmInstance = new BenchService();
        for (let i = 0; i < 10_000; i++) {
          consumeChecksum(this.warmInstance.value);
        }
        break;
      case "register_batch":
        this.batchClasses = Array.from(
          { length: BATCH_COUNT },
          () => class BatchService extends BenchService {},
        );
        break;
    }
  }

  run(): number {
    switch (this.scenario) {
      case "singleton_cold":
        return consumeChecksum(new BenchService());
      case "singleton_warm":
        return consumeChecksum(this.warmInstance!.value);
      case "transient":
        return consumeChecksum(new BenchService());
      case "deep_graph":
        return consumeChecksum(buildDeepGraph().d.c.b.a.value);
      case "wide_graph":
        return consumeChecksum(buildWideGraph().e.d.c.b.a.value);
      case "factory_deps":
        return consumeChecksum(new FactoryService(new Logger(), new Config()));
      case "register_batch": {
        let checksum = 0;
        for (const cls of this.batchClasses) {
          checksum ^= consumeChecksum(new cls());
        }
        return checksum;
      }
    }
    return 0;
  }

  teardown(): void {
    this.warmInstance = null;
    this.batchClasses = [];
  }
}

export const baselineAdapter: BenchAdapter = {
  id: "baseline",
  label: "baseline (new)",
  supports: (scenario) => scenario !== "request_scope",
  createScenario: (scenario) => new BaselineScenario(scenario),
};
