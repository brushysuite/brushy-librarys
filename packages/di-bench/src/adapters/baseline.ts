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
  private deepGraph: NodeE | null = null;
  private wideGraph: HubService | null = null;
  private factoryService: FactoryService | null = null;
  private batchClasses: (new () => BenchService)[] = [];

  constructor(private readonly scenario: ScenarioId) {}

  setup(): void {
    this.teardown();

    switch (this.scenario) {
      case "singleton_warm":
        this.warmInstance = new BenchService();
        for (let i = 0; i < 10_000; i++) {
          void this.warmInstance.value;
        }
        break;
      case "deep_graph":
        this.deepGraph = buildDeepGraph();
        break;
      case "wide_graph":
        this.wideGraph = buildWideGraph();
        break;
      case "factory_deps":
        this.factoryService = new FactoryService(new Logger(), new Config());
        break;
      case "register_batch":
        this.batchClasses = Array.from(
          { length: BATCH_COUNT },
          () => class BatchService extends BenchService {},
        );
        break;
    }
  }

  run(): void {
    switch (this.scenario) {
      case "singleton_cold":
        new BenchService();
        break;
      case "singleton_warm":
        void this.warmInstance!.value;
        break;
      case "transient":
        new BenchService();
        break;
      case "deep_graph":
        void this.deepGraph!.d.c.b.a.value;
        break;
      case "wide_graph":
        void this.wideGraph!.e.d.c.b.a.value;
        break;
      case "factory_deps":
        void this.factoryService!.logger;
        break;
      case "register_batch":
        for (const cls of this.batchClasses) {
          new cls();
        }
        break;
    }
  }

  teardown(): void {
    this.warmInstance = null;
    this.deepGraph = null;
    this.wideGraph = null;
    this.factoryService = null;
    this.batchClasses = [];
  }
}

export const baselineAdapter: BenchAdapter = {
  id: "baseline",
  label: "baseline (new)",
  supports: (scenario) => scenario !== "request_scope",
  createScenario: (scenario) => new BaselineScenario(scenario),
};
