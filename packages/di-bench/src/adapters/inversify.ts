import "reflect-metadata";
import { Container, injectable, inject } from "inversify";
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
import { consumeChecksum } from "../fixtures/checksum.js";
import type { BenchAdapter, BenchScenario, ScenarioId } from "../types.js";

@injectable()
class InversifyBenchService extends BenchService {}

@injectable()
class InversifyLogger extends Logger {}

@injectable()
class InversifyConfig extends Config {}

@injectable()
class InversifyNodeA extends NodeA {}

@injectable()
class InversifyNodeB extends NodeB {
  constructor(@inject(InversifyNodeA) a: InversifyNodeA) {
    super(a);
  }
}

@injectable()
class InversifyNodeC extends NodeC {
  constructor(@inject(InversifyNodeB) b: InversifyNodeB) {
    super(b);
  }
}

@injectable()
class InversifyNodeD extends NodeD {
  constructor(@inject(InversifyNodeC) c: InversifyNodeC) {
    super(c);
  }
}

@injectable()
class InversifyNodeE extends NodeE {
  constructor(@inject(InversifyNodeD) d: InversifyNodeD) {
    super(d);
  }
}

@injectable()
class InversifyHubService extends HubService {
  constructor(
    @inject(InversifyNodeA) a: InversifyNodeA,
    @inject(InversifyNodeB) b: InversifyNodeB,
    @inject(InversifyNodeC) c: InversifyNodeC,
    @inject(InversifyNodeD) d: InversifyNodeD,
    @inject(InversifyNodeE) e: InversifyNodeE,
  ) {
    super(a, b, c, d, e);
  }
}

@injectable()
class InversifyFactoryService extends FactoryService {
  constructor(
    @inject(InversifyLogger) logger: InversifyLogger,
    @inject(InversifyConfig) config: InversifyConfig,
  ) {
    super(logger, config);
  }
}

function bindDeepGraph(container: Container): void {
  container.bind(InversifyNodeA).toSelf().inSingletonScope();
  container.bind(InversifyNodeB).toSelf().inSingletonScope();
  container.bind(InversifyNodeC).toSelf().inSingletonScope();
  container.bind(InversifyNodeD).toSelf().inSingletonScope();
  container.bind(InversifyNodeE).toSelf().inSingletonScope();
}

function bindWideGraph(container: Container): void {
  bindDeepGraph(container);
  container.bind(InversifyHubService).toSelf().inSingletonScope();
}

class InversifyScenario implements BenchScenario {
  private container: Container | null = null;
  private batchClasses: (new () => InversifyBenchService)[] = [];

  constructor(private readonly scenario: ScenarioId) {}

  setup(): void {
    this.teardown();
    this.container = new Container();

    switch (this.scenario) {
      case "singleton_cold":
        break;
      case "singleton_warm":
        this.container.bind(InversifyBenchService).toSelf().inSingletonScope();
        for (let i = 0; i < 10_000; i++) {
          consumeChecksum(this.container.get(InversifyBenchService));
        }
        break;
      case "transient":
        this.container.bind(InversifyBenchService).toSelf().inTransientScope();
        break;
      case "deep_graph":
        bindDeepGraph(this.container);
        break;
      case "wide_graph":
        bindWideGraph(this.container);
        break;
      case "factory_deps":
        this.container.bind(InversifyLogger).toSelf().inSingletonScope();
        this.container.bind(InversifyConfig).toSelf().inSingletonScope();
        this.container.bind(InversifyFactoryService).toSelf().inSingletonScope();
        for (let i = 0; i < 10_000; i++) {
          consumeChecksum(this.container.get(InversifyFactoryService));
        }
        break;
      case "register_batch":
        this.batchClasses = Array.from(
          { length: BATCH_COUNT },
          (_, i) =>
            class BatchService extends InversifyBenchService {
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
        const c = new Container();
        c.bind(InversifyBenchService).toSelf().inSingletonScope();
        return consumeChecksum(c.get(InversifyBenchService));
      }
      case "singleton_warm":
        return consumeChecksum(container.get(InversifyBenchService));
      case "transient":
        return consumeChecksum(container.get(InversifyBenchService));
      case "deep_graph":
        return consumeChecksum(container.get(InversifyNodeE).d.c.b.a.value);
      case "wide_graph":
        return consumeChecksum(container.get(InversifyHubService).e.d.c.b.a.value);
      case "factory_deps":
        return consumeChecksum(container.get(InversifyFactoryService));
      case "register_batch": {
        const c = new Container();
        for (const cls of this.batchClasses) {
          c.bind(cls).toSelf().inSingletonScope();
        }
        return consumeChecksum(BATCH_COUNT);
      }
    }
    return 0;
  }

  teardown(): void {
    this.container = null;
    this.batchClasses = [];
  }
}

export const inversifyAdapter: BenchAdapter = {
  id: "inversify",
  label: "inversify",
  supports: (scenario) => scenario !== "request_scope",
  createScenario: (scenario) => new InversifyScenario(scenario),
};
