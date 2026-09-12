import { describe, expect, it } from "vitest";
import { Container } from "../core/container";
import { defineModule } from "../tools/module";
import { createToken } from "./tokens";

class AuthService {
  login() {
    return "ok";
  }
}

describe("createToken", () => {
  it("should create a symbol usable in register/resolve", () => {
    const container = new Container();
    const AUTH = createToken<AuthService>("AUTH");

    expect(typeof AUTH).toBe("symbol");

    container.register(AUTH, { useClass: AuthService });
    const auth = container.resolve(AUTH);

    expect(auth).toBeInstanceOf(AuthService);
    expect(auth.login()).toBe("ok");
  });

  it("should work with standalone resolve", () => {
    const container = new Container();
    const LOGGER = createToken<{ log: (msg: string) => void }>("LOGGER");

    container.register(LOGGER, {
      useValue: { log: (msg: string) => msg },
    });

    const logger = container.resolve(LOGGER);
    expect(logger.log("test")).toBe("test");
  });

  it("should infer type from class token", () => {
    const container = new Container();

    container.register(AuthService, { useClass: AuthService });
    const auth = container.resolve(AuthService);

    expect(auth).toBeInstanceOf(AuthService);
  });
});

describe("defineModule", () => {
  it("should register all providers and expose typed tokens", () => {
    const container = new Container();
    const module = defineModule({
      auth: { useClass: AuthService },
      logger: { useValue: { log: () => {} } },
    });

    module.register(container);

    const auth = container.resolve(module.tokens.auth);
    const logger = container.resolve(module.tokens.logger);

    expect(auth).toBeInstanceOf(AuthService);
    expect(typeof logger.log).toBe("function");
  });
});
