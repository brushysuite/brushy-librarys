import { describe, expectTypeOf, it } from "vitest";
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

class Config {
  api = "https://api.test";
}

describe("factory dependencies type inference", () => {
  it("should infer factory argument types from deps tuple", () => {
    const LOGGER = createToken<Logger>("LOGGER");
    const CONFIG = createToken<Config>("CONFIG");
    const AUTH = createToken<AuthService>("AUTH");

    function registerAuth(
      config: typeof AUTH,
      factory: (logger: Logger, config: Config) => AuthService,
      dependencies: [typeof LOGGER, typeof CONFIG],
    ) {
      return { config, factory, dependencies };
    }

    const registration = registerAuth(
      AUTH,
      (logger, config) => new AuthService(logger),
      deps([LOGGER, CONFIG]),
    );

    expectTypeOf(registration.factory).parameters.toEqualTypeOf<
      [Logger, Config]
    >();
  });

  it("should infer resolve type from factory registration", () => {
    const LOGGER = createToken<Logger>("LOGGER");
    const AUTH = createToken<AuthService>("AUTH");
    const container = new Container();

    container.register(LOGGER, { useClass: Logger });
    container.register(AUTH, {
      useFactory: (logger) => new AuthService(logger),
      dependencies: deps([LOGGER]),
    });

    expectTypeOf(container.resolve(AUTH)).toEqualTypeOf<AuthService>();
  });
});
