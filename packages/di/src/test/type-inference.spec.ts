import { describe, it, expect, beforeEach } from "vitest";
import { Container, createToken, defineModule } from "../index";

class GreeterService {
  greet(name: string) {
    return `Hello, ${name}`;
  }
}

describe("Type inference (E2E)", () => {
  let container: Container;

  beforeEach(() => {
    container = new Container();
  });

  it("should resolve with inferred type from createToken", () => {
    const GREETER = createToken<GreeterService>("GREETER");
    container.register(GREETER, { useClass: GreeterService });

    const greeter = container.resolve(GREETER);
    expect(greeter.greet("World")).toBe("Hello, World");
  });

  it("should resolve with inferred type from class token", () => {
    container.register(GreeterService, { useClass: GreeterService });

    const greeter = container.resolve(GreeterService);
    expect(greeter.greet("Brushy")).toBe("Hello, Brushy");
  });

  it("should work with defineModule and resolve", () => {
    const module = defineModule({
      greeter: { useClass: GreeterService },
    });

    module.register(container);
    const greeter = container.resolve(module.tokens.greeter);

    expect(greeter.greet("Module")).toBe("Hello, Module");
  });
});
