import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Container, resolve, server } from "../index";
import { containerRegistry } from "../lib";

describe("Resolve", () => {
  let container: Container;

  beforeEach(() => {
    container = new Container();
    vi.clearAllMocks();

    containerRegistry.setDefaultContainer(container);
  });

  afterEach(() => {
    vi.restoreAllMocks();

    containerRegistry.setDefaultContainer(null as any);

    try {
      server.clearRequestScope();
    } catch (error) {}
  });

  it("should resolve dependencies globally", () => {
    const SERVICE = Symbol("SERVICE");
    container.register(SERVICE, {
      useValue: { name: "Test Service" },
    });

    const service = resolve<{ name: string }>(SERVICE);

    expect(service).toBeDefined();
    expect(service.name).toBe("Test Service");
  });

  it("should resolve dependencies with scope", () => {
    const container1 = new Container();
    const container2 = new Container();

    const SERVICE = Symbol("SERVICE");
    container1.register(SERVICE, { useValue: { name: "Service 1" } });
    container2.register(SERVICE, { useValue: { name: "Service 2" } });

    containerRegistry.setDefaultContainer(container1);
    const service1 = resolve<{ name: string }>(SERVICE);
    expect(service1.name).toBe("Service 1");

    containerRegistry.setDefaultContainer(container2);
    const service2 = resolve<{ name: string }>(SERVICE);
    expect(service2.name).toBe("Service 2");
  });

  it("should throw an error when resolving an unregistered dependency", () => {
    expect(() => {
      resolve("NON_EXISTENT_TOKEN");
    }).toThrow();
  });

  it("should resolve dependencies with different types of tokens", () => {
    const symbolToken = Symbol("SYMBOL_TOKEN");
    const stringToken = "STRING_TOKEN";

    container.register(symbolToken, { useValue: { type: "symbol" } });
    container.register(stringToken, { useValue: { type: "string" } });

    const symbolService = resolve<{ type: string }>(symbolToken);
    const stringService = resolve<{ type: string }>(stringToken);

    expect(symbolService.type).toBe("symbol");
    expect(stringService.type).toBe("string");
  });

  it("should resolve dependencies with injected dependencies", () => {
    class Logger {
      log(message: string) {
        return `[LOG] ${message}`;
      }
    }

    class Service {
      constructor(private logger: Logger) {}

      doSomething() {
        return this.logger.log("Service did something");
      }
    }

    const LOGGER = Symbol("LOGGER");
    const SERVICE = Symbol("SERVICE");

    container.register(LOGGER, { useClass: Logger });
    container.register(SERVICE, {
      useClass: Service,
      dependencies: [LOGGER],
    });

    const service = resolve<Service>(SERVICE);

    expect(service.doSomething()).toBe("[LOG] Service did something");
  });
});
