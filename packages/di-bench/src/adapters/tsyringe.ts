import "reflect-metadata";
import {
  type DependencyContainer,
  injectable,
  Lifecycle,
  container as rootContainer,
} from "tsyringe";
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

function registerDeepGraph(container: DependencyContainer): void {
  container.register(
    TsyringeNodeA,
    { useClass: TsyringeNodeA },
    { lifecycle: Lifecycle.Singleton },
  );
  container.register(
    TsyringeNodeB,
    { useClass: TsyringeNodeB },
    { lifecycle: Lifecycle.Singleton },
  );
  container.register(
    TsyringeNodeC,
    { useClass: TsyringeNodeC },
    { lifecycle: Lifecycle.Singleton },
  );
  container.register(
    TsyringeNodeD,
    { useClass: TsyringeNodeD },
    { lifecycle: Lifecycle.Singleton },
  );
  container.register(
    TsyringeNodeE,
    { useClass: TsyringeNodeE },
    { lifecycle: Lifecycle.Singleton },
  );
}

function registerWideGraph(container: DependencyContainer): void {
  registerDeepGraph(container);
  container.register(
    TsyringeHubService,
    { useClass: TsyringeHubService },
    { lifecycle: Lifecycle.Singleton },
  );
}

class TsyringeScenario implements BenchScenario {
  private container: DependencyContainer | null = null;
  private batchClasses: (new () => TsyringeBenchService)[] = [];

  constructor(private readonly scenario: ScenarioId) {}

  setup(): void {
    this.teardown();
    this.container = rootContainer.createChildContainer();

    switch (this.scenario) {
      case "singleton_cold":
        break;
      case "singleton_warm":
        this.container.register(
          TsyringeBenchService,
          { useClass: TsyringeBenchService },
          { lifecycle: Lifecycle.Singleton },
        );
        for (let i = 0; i < 10_000; i++) {
          consumeChecksum(this.container.resolve(TsyringeBenchService));
        }
        break;
      case "transient":
        this.container.register(
          TsyringeBenchService,
          { useClass: TsyringeBenchService },
          { lifecycle: Lifecycle.Transient },
        );
        break;
      case "deep_graph":
        registerDeepGraph(this.container);
        break;
      case "wide_graph":
        registerWideGraph(this.container);
        break;
      case "factory_deps":
        this.container.register(
          TsyringeLogger,
          { useClass: TsyringeLogger },
          { lifecycle: Lifecycle.Singleton },
        );
        this.container.register(
          TsyringeConfig,
          { useClass: TsyringeConfig },
          { lifecycle: Lifecycle.Singleton },
        );
        this.container.register(
          TsyringeFactoryService,
          { useClass: TsyringeFactoryService },
          { lifecycle: Lifecycle.Singleton },
        );
        for (let i = 0; i < 10_000; i++) {
          consumeChecksum(this.container.resolve(TsyringeFactoryService));
        }
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

  run(): number {
    const container = this.container!;

    switch (this.scenario) {
      case "singleton_cold": {
        const c = rootContainer.createChildContainer();
        c.register(
          TsyringeBenchService,
          { useClass: TsyringeBenchService },
          { lifecycle: Lifecycle.Singleton },
        );
        return consumeChecksum(c.resolve(TsyringeBenchService));
      }
      case "singleton_warm":
        return consumeChecksum(container.resolve(TsyringeBenchService));
      case "transient":
        return consumeChecksum(container.resolve(TsyringeBenchService));
      case "deep_graph":
        return consumeChecksum(container.resolve(TsyringeNodeE).d.c.b.a.value);
      case "wide_graph":
        return consumeChecksum(container.resolve(TsyringeHubService).e.d.c.b.a.value);
      case "factory_deps":
        return consumeChecksum(container.resolve(TsyringeFactoryService));
      case "register_batch": {
        const c = rootContainer.createChildContainer();
        for (const cls of this.batchClasses) {
          c.register(cls, { useClass: cls }, { lifecycle: Lifecycle.Singleton });
        }
        return consumeChecksum(BATCH_COUNT);
      }
    }
    return 0;
  }

  teardown(): void {
    this.container?.clearInstances();
    this.container = null;
    this.batchClasses = [];
  }
}

export const tsyringeAdapter: BenchAdapter = {
  id: "tsyringe",
  label: "tsyringe",
  supports: (scenario) => scenario !== "request_scope",
  createScenario: (scenario) => new TsyringeScenario(scenario),
};
