import { describe, it, expect } from "vitest";
import { Container } from "../core/container";
import { createToken, deps } from "./tokens";

class Logger {
  log(msg: string) {
    return msg;
  }
}

class AuthService {
  constructor(private logger: Logger) {}
  getUser() {
    return this.logger.log("user");
  }
}

describe("factory dependencies inference", () => {
  it("should resolve factory with typed dependencies at runtime", () => {
    const container = new Container();
    const LOGGER = createToken<Logger>("LOGGER");
    const AUTH = createToken<AuthService>("AUTH");

    container.register(LOGGER, { useClass: Logger });
    container.register(AUTH, {
      useFactory: (logger) => new AuthService(logger),
      dependencies: deps([LOGGER]),
    });

    const auth = container.resolve(AUTH);
    expect(auth.getUser()).toBe("user");
  });

  it("createBrushyApp bootstraps container and module", async () => {
    const { createBrushyApp } = await import("../tools/bootstrap");
    const app = createBrushyApp({
      logger: { useClass: Logger },
    });

    expect(app.container.resolve(app.module.tokens.logger)).toBeInstanceOf(
      Logger,
    );
  });
});
