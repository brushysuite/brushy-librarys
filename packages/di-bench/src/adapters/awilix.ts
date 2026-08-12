import {
  asClass,
  asFunction,
  createContainer,
  InjectionMode,
  type AwilixContainer,
  Lifetime,
} from "awilix";
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

function createAwilixContainer(): AwilixContainer {
  return createContainer({ injectionMode: InjectionMode.CLASSIC });
}

function registerDeepGraph(container: AwilixContainer): void {
  container.register({
    a: asClass(NodeA).singleton(),
    b: asClass(NodeB).singleton(),
    c: asClass(NodeC).singleton(),
    d: asClass(NodeD).singleton(),
    e: asClass(NodeE).singleton(),
  });
}

function registerWideGraph(container: AwilixContainer): void {
  registerDeepGraph(container);
  container.register({
    hub: asClass(HubService).singleton(),
  });
}

class AwilixScenario implements BenchScenario {
  private container: AwilixContainer | null = null;
  private batchNames: string[] = [];

  constructor(private readonly scenario: ScenarioId) {}

  setup(): void {
    this.teardown();
    this.container = createAwilixContainer();

    switch (this.scenario) {
      case "singleton_cold":
        break;
      case "singleton_warm":
        this.container.register({
          bench: asClass(BenchService).singleton(),
        });
        for (let i = 0; i < 10_000; i++) {
          consumeChecksum(this.container.resolve("bench"));
        }
        break;
      case "transient":
        this.container.register({
          bench: asClass(BenchService).setLifetime(Lifetime.TRANSIENT),
        });
        break;
      case "deep_graph":
        registerDeepGraph(this.container);
        break;
      case "wide_graph":
        registerWideGraph(this.container);
        break;
      case "factory_deps":
        this.container.register({
          logger: asClass(Logger).singleton(),
          config: asClass(Config).singleton(),
          // CLASSIC mode: positional params by name (not PROXY object destructuring).
          factory: asFunction(
            (logger: Logger, config: Config) => new FactoryService(logger, config),
          ).singleton(),
        });
        for (let i = 0; i < 10_000; i++) {
          consumeChecksum(this.container.resolve("factory"));
        }
        break;
      case "register_batch":
        this.batchNames = Array.from({ length: BATCH_COUNT }, (_, i) => `batch${i}`);
        break;
      case "request_scope":
        this.container.register({
          scoped: asClass(ScopedService).scoped(),
        });
        break;
    }
  }

  run(): number {
    const container = this.container!;

    switch (this.scenario) {
      case "singleton_cold": {
        const c = createAwilixContainer();
        c.register({ bench: asClass(BenchService).singleton() });
        return consumeChecksum(c.resolve("bench"));
      }
      case "singleton_warm":
        return consumeChecksum(container.resolve("bench"));
      case "transient":
        return consumeChecksum(container.resolve("bench"));
      case "deep_graph":
        return consumeChecksum(container.resolve("e").d.c.b.a.value);
      case "wide_graph":
        return consumeChecksum(container.resolve("hub").e.d.c.b.a.value);
      case "factory_deps":
        return consumeChecksum(container.resolve("factory"));
      case "register_batch": {
        const c = createAwilixContainer();
        for (let i = 0; i < BATCH_COUNT; i++) {
          c.register({
            [this.batchNames[i]!]: asClass(BenchService).singleton(),
          });
        }
        return consumeChecksum(BATCH_COUNT);
      }
      case "request_scope": {
        const scope = container.createScope();
        try {
          return consumeChecksum(scope.resolve("scoped").id);
        } finally {
          scope.dispose();
        }
      }
    }
  }

  teardown(): void {
    this.container = null;
    this.batchNames = [];
  }
}

export const awilixAdapter: BenchAdapter = {
  id: "awilix",
  label: "awilix",
  supports: () => true,
  createScenario: (scenario) => new AwilixScenario(scenario),
};
