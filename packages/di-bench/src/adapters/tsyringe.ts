import "reflect-metadata";
import { container, injectable, Lifecycle } from "tsyringe";
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

@injectable()
class TsyringeBenchService extends BenchService {}

@injectable()
class TsyringeLogger extends Logger {}

@injectable()
class TsyringeConfig extends Config {}

@injectable()
class TsyringeNodeA extends NodeA {}

@injectable()
class TsyringeNodeB extends NodeB {
  constructor(a: TsyringeNodeA) {
    super(a);
  }
}

@injectable()
class TsyringeNodeC extends NodeC {
  constructor(b: TsyringeNodeB) {
    super(b);
  }
}

@injectable()
class TsyringeNodeD extends NodeD {
  constructor(c: TsyringeNodeC) {
    super(c);
  }
}

@injectable()
class TsyringeNodeE extends NodeE {
  constructor(d: TsyringeNodeD) {
    super(d);
  }
}

@injectable()
class TsyringeHubService extends HubService {
  constructor(
    a: TsyringeNodeA,
    b: TsyringeNodeB,
    c: TsyringeNodeC,
    d: TsyringeNodeD,
    e: TsyringeNodeE,
  ) {
    super(a, b, c, d, e);
  }
}

@injectable()
class TsyringeFactoryService extends FactoryService {
  constructor(logger: TsyringeLogger, config: TsyringeConfig) {
    super(logger, config);
  }
}

function registerDeepGraph(): void {
  container.register(TsyringeNodeA, { useClass: TsyringeNodeA });
  container.register(TsyringeNodeB, { useClass: TsyringeNodeB });
  container.register(TsyringeNodeC, { useClass: TsyringeNodeC });
  container.register(TsyringeNodeD, { useClass: TsyringeNodeD });
  container.register(TsyringeNodeE, { useClass: TsyringeNodeE });
}

function registerWideGraph(): void {
  registerDeepGraph();
  container.register(TsyringeHubService, { useClass: TsyringeHubService });
}

class TsyringeScenario implements BenchScenario {
  private batchClasses: (new () => TsyringeBenchService)[] = [];

  constructor(private readonly scenario: ScenarioId) {}

  setup(): void {
    this.teardown();
    container.clearInstances();

    switch (this.scenario) {
      case "singleton_cold":
        break;
      case "singleton_warm":
        container.register(TsyringeBenchService, {
          useClass: TsyringeBenchService,
        });
        for (let i = 0; i < 10_000; i++) {
          container.resolve(TsyringeBenchService);
        }
        break;
      case "transient":
        container.register(TsyringeBenchService, {
          useClass: TsyringeBenchService,
        }, { lifecycle: Lifecycle.Transient });
        break;
      case "deep_graph":
        registerDeepGraph();
        break;
      case "wide_graph":
        registerWideGraph();
        break;
      case "factory_deps":
        container.register(TsyringeLogger, { useClass: TsyringeLogger });
        container.register(TsyringeConfig, { useClass: TsyringeConfig });
        container.register(TsyringeFactoryService, {
          useClass: TsyringeFactoryService,
        });
        break;
      case "register_batch":
        this.batchClasses = Array.from(
          { length: BATCH_COUNT },
          (_, i) =>
            class BatchService extends TsyringeBenchService {
              idx = i;
            },
        );
        break;
    }
  }

  run(): void {
    switch (this.scenario) {
      case "singleton_cold": {
        container.clearInstances();
        container.register(TsyringeBenchService, {
          useClass: TsyringeBenchService,
        });
        container.resolve(TsyringeBenchService);
        break;
      }
      case "singleton_warm":
        container.resolve(TsyringeBenchService);
        break;
      case "transient":
        container.resolve(TsyringeBenchService);
        break;
      case "deep_graph":
        container.resolve(TsyringeNodeE);
        break;
      case "wide_graph":
        container.resolve(TsyringeHubService);
        break;
      case "factory_deps":
        container.resolve(TsyringeFactoryService);
        break;
      case "register_batch":
        container.clearInstances();
        for (const cls of this.batchClasses) {
          container.register(cls, { useClass: cls });
        }
        break;
    }
  }

  teardown(): void {
    container.clearInstances();
    this.batchClasses = [];
  }
}

export const tsyringeAdapter: BenchAdapter = {
  id: "tsyringe",
  label: "tsyringe",
  supports: (scenario) => scenario !== "request_scope",
  createScenario: (scenario) => new TsyringeScenario(scenario),
};
