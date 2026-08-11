import { describe, expectTypeOf, it } from "vitest";
import { createToken } from "@brushy/di-core";
import { useInject } from "../use-inject";

class UserService {
  getName() {
    return "user";
  }
}

describe("React type inference", () => {
  it("should infer useInject return type from createToken", () => {
    const USER = createToken<UserService>("USER");

    function injectUser(token: typeof USER) {
      return useInject(token);
    }

    expectTypeOf(injectUser).returns.toEqualTypeOf<UserService>();
  });
});
