import {
  asClass,
  asFunction,
  createContainer,
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
import type { BenchAdapter, BenchScenario, ScenarioId } from "../types.js";

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
    this.container = createContainer();

    switch (this.scenario) {
      case "singleton_cold":
        break;
      case "singleton_warm":
        this.container.register({
          bench: asClass(BenchService).singleton(),
        });
        for (let i = 0; i < 10_000; i++) {
          this.container.resolve("bench");
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
          factory: asFunction(
            ({ logger, config }: { logger: Logger; config: Config }) =>
              new FactoryService(logger, config),
          ).singleton(),
        });
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

  run(): void {
    const container = this.container!;

    switch (this.scenario) {
      case "singleton_cold": {
        const c = createContainer();
        c.register({ bench: asClass(BenchService).singleton() });
        c.resolve("bench");
        break;
      }
      case "singleton_warm":
        container.resolve("bench");
        break;
      case "transient":
        container.resolve("bench");
        break;
      case "deep_graph":
        container.resolve("e");
        break;
      case "wide_graph":
        container.resolve("hub");
        break;
      case "factory_deps":
        container.resolve("factory");
        break;
      case "register_batch": {
        const c = createContainer();
        for (let i = 0; i < BATCH_COUNT; i++) {
          c.register({
            [this.batchNames[i]]: asClass(BenchService).singleton(),
          });
        }
        break;
      }
      case "request_scope": {
        const scope = container.createScope();
        scope.resolve("scoped");
        break;
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
