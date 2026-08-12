import { Container, createToken, deps } from "@brushy/di-core";
import type { InjectionToken } from "@brushy/di-core";
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
  ScopedService,
} from "../fixtures/classes.js";
import { consumeChecksum } from "../fixtures/checksum.js";
import type { BenchAdapter, BenchScenario, ScenarioId } from "../types.js";

const SINGLETON = createToken<BenchService>("SINGLETON");
const TRANSIENT = createToken<BenchService>("TRANSIENT");
const DEEP = createToken<NodeE>("DEEP");
const WIDE = createToken<HubService>("WIDE");
const FACTORY = createToken<FactoryService>("FACTORY");
const SCOPED = createToken<ScopedService>("SCOPED");
const LOGGER = createToken<Logger>("LOGGER");
const CONFIG = createToken<Config>("CONFIG");

function registerDeepGraph(container: Container): void {
  const tokenA = createToken<NodeA>("A");
  const tokenB = createToken<NodeB>("B");
  const tokenC = createToken<NodeC>("C");
  const tokenD = createToken<NodeD>("D");

  container.register(tokenA, { useClass: NodeA, lifecycle: "singleton" });
  container.register(tokenB, {
    useClass: NodeB,
    dependencies: deps([tokenA]),
    lifecycle: "singleton",
  });
  container.register(tokenC, {
    useClass: NodeC,
    dependencies: deps([tokenB]),
    lifecycle: "singleton",
  });
  container.register(tokenD, {
    useClass: NodeD,
    dependencies: deps([tokenC]),
    lifecycle: "singleton",
  });
  container.register(DEEP, {
    useClass: NodeE,
    dependencies: deps([tokenD]),
    lifecycle: "singleton",
  });
}

function registerWideGraph(container: Container): void {
  const tokenA = createToken<NodeA>("WA");
  const tokenB = createToken<NodeB>("WB");
  const tokenC = createToken<NodeC>("WC");
  const tokenD = createToken<NodeD>("WD");
  const tokenE = createToken<NodeE>("WE");

  container.register(tokenA, { useClass: NodeA, lifecycle: "singleton" });
  container.register(tokenB, {
    useClass: NodeB,
    dependencies: deps([tokenA]),
    lifecycle: "singleton",
  });
  container.register(tokenC, {
    useClass: NodeC,
    dependencies: deps([tokenB]),
    lifecycle: "singleton",
  });
  container.register(tokenD, {
    useClass: NodeD,
    dependencies: deps([tokenC]),
    lifecycle: "singleton",
  });
  container.register(tokenE, {
    useClass: NodeE,
    dependencies: deps([tokenD]),
    lifecycle: "singleton",
  });
  container.register(WIDE, {
    useClass: HubService,
    dependencies: deps([tokenA, tokenB, tokenC, tokenD, tokenE]),
    lifecycle: "singleton",
  });
}

class BrushyScenario implements BenchScenario {
  private container: Container | null = null;
  private batchTokens: InjectionToken<BenchService>[] = [];
  private batchClasses: (new () => BenchService)[] = [];

  constructor(private readonly scenario: ScenarioId) {}

  setup(): void {
    this.teardown();
    this.container = new Container();

    switch (this.scenario) {
      case "singleton_cold":
        break;
      case "singleton_warm":
        this.container.register(SINGLETON, {
          useClass: BenchService,
          lifecycle: "singleton",
        });
        for (let i = 0; i < 10_000; i++) {
          consumeChecksum(this.container.resolve(SINGLETON));
        }
        break;
      case "transient":
        this.container.register(TRANSIENT, {
          useClass: BenchService,
          lifecycle: "transient",
        });
        break;
      case "deep_graph":
        registerDeepGraph(this.container);
        break;
      case "wide_graph":
        registerWideGraph(this.container);
        break;
      case "factory_deps":
        this.container.register(LOGGER, { useClass: Logger, lifecycle: "singleton" });
        this.container.register(CONFIG, {
          useValue: new Config(),
          lifecycle: "singleton",
        });
        this.container.register(FACTORY, {
          useFactory: (logger: Logger, config: Config) =>
            new FactoryService(logger, config),
          dependencies: deps([LOGGER, CONFIG]),
          lifecycle: "singleton",
        });
        for (let i = 0; i < 10_000; i++) {
          consumeChecksum(this.container.resolve(FACTORY));
        }
        break;
      case "register_batch":
        this.batchTokens = [];
        this.batchClasses = [];
        for (let i = 0; i < BATCH_COUNT; i++) {
          const token = createToken<BenchService>(`BATCH_${i}`);
          const useClass = class BatchService extends BenchService {
            idx = i;
          };
          this.batchTokens.push(token);
          this.batchClasses.push(useClass);
        }
        break;
      case "request_scope":
        this.container.register(SCOPED, {
          useClass: ScopedService,
          lifecycle: "scoped",
        });
        break;
    }
  }

  run(): number {
    const container = this.container!;

    switch (this.scenario) {
      case "singleton_cold": {
        const c = new Container();
        c.register(SINGLETON, { useClass: BenchService, lifecycle: "singleton" });
        return consumeChecksum(c.resolve(SINGLETON));
      }
      case "singleton_warm":
        return consumeChecksum(container.resolve(SINGLETON));
      case "transient":
        return consumeChecksum(container.resolve(TRANSIENT));
      case "deep_graph":
        return consumeChecksum(container.resolve(DEEP).d.c.b.a.value);
      case "wide_graph":
        return consumeChecksum(container.resolve(WIDE).e.d.c.b.a.value);
      case "factory_deps":
        return consumeChecksum(container.resolve(FACTORY));
      case "register_batch": {
        const c = new Container();
        for (let i = 0; i < BATCH_COUNT; i++) {
          c.register(this.batchTokens[i]!, {
            useClass: this.batchClasses[i]!,
            lifecycle: "singleton",
          });
        }
        return consumeChecksum(BATCH_COUNT);
      }
      case "request_scope": {
        const scope = container.createScope();
        try {
          return consumeChecksum(scope.resolve(SCOPED).id);
        } finally {
          scope.dispose();
        }
      }
    }
  }

  teardown(): void {
    this.container = null;
    this.batchTokens = [];
    this.batchClasses = [];
  }
}

export const brushyAdapter: BenchAdapter = {
  id: "brushy",
  label: "@brushy/di-core",
  supports: () => true,
  createScenario: (scenario) => new BrushyScenario(scenario),
};
