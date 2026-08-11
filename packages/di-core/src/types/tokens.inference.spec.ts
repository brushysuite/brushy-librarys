import { describe, expectTypeOf, it } from "vitest";
import { Container } from "../core/container";
import { createToken } from "./tokens";
import { defineModule } from "../tools/module";

class AuthService {
  login(): string {
    return "ok";
  }
}

describe("type inference", () => {
  it("should infer type from createToken", () => {
    const AUTH = createToken<AuthService>("AUTH");
    const container = new Container();
    container.register(AUTH, { useClass: AuthService });

    expectTypeOf(container.resolve(AUTH)).toEqualTypeOf<AuthService>();
  });

  it("should infer type from class token", () => {
    const container = new Container();
    container.register(AuthService, { useClass: AuthService });

    expectTypeOf(container.resolve(AuthService)).toEqualTypeOf<AuthService>();
  });

  it("should infer types from defineModule tokens", () => {
    const module = defineModule({
      auth: { useClass: AuthService },
      logger: { useValue: { log: (msg: string) => msg } },
    });

    expectTypeOf(module.tokens.auth).toEqualTypeOf<
      import("./tokens").InjectionToken<AuthService>
    >();
    expectTypeOf(module.types.auth).toEqualTypeOf<AuthService>();
    expectTypeOf(module.types.logger).toEqualTypeOf<{ log: (msg: string) => string }>();
  });

  it("should require manual generic for legacy symbol tokens", () => {
    const LEGACY = Symbol("LEGACY");

    function resolveLegacy<T>(token: typeof LEGACY): T {
      return null as unknown as T;
    }

    expectTypeOf(resolveLegacy<AuthService>).returns.toEqualTypeOf<AuthService>();
  });
});
