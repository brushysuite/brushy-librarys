import { describe, expectTypeOf, it } from "vitest";
import React from "react";
import { Container, createToken } from "@brushy/di-core";
import { useInject } from "../use-inject";
import { useInjectComponent } from "../inject-component";

class UserService {
  getName() {
    return "user";
  }
}

function MockComponent(_props: { label?: string }): null {
  return null;
}

type IsAny<T> = 0 extends 1 & T ? true : false;

describe("React type inference", () => {
  it("should infer useInject return type from createToken", () => {
    const USER = createToken<UserService>("USER");

    function injectUser(token: typeof USER) {
      return useInject(token);
    }

    expectTypeOf(injectUser).returns.toEqualTypeOf<UserService>();
  });

  it("should infer useInjectComponent return type from createToken", () => {
    const BUTTON = createToken<typeof MockComponent>("BUTTON");

    function injectButton(token: typeof BUTTON) {
      return useInjectComponent(token);
    }

    expectTypeOf(injectButton).returns.toEqualTypeOf<typeof MockComponent>();
  });

  it("should infer useInjectComponent return type after register with useValue", () => {
    const container = new Container();
    const BUTTON = container.register(createToken("BUTTON"), {
      useValue: MockComponent,
    });

    function Component() {
      const Button = useInjectComponent(BUTTON);
      type ButtonProps = React.ComponentProps<typeof Button>;

      expectTypeOf(Button).toEqualTypeOf<typeof MockComponent>();
      expectTypeOf<ButtonProps>().toEqualTypeOf<{
        label?: string;
      }>();
      expectTypeOf<IsAny<ButtonProps>>().toEqualTypeOf<false>();
      return null;
    }

    expectTypeOf(container.resolve(BUTTON)).toEqualTypeOf<typeof MockComponent>();

    // Silence "Component is declared but never read" warning
    void Component;
  });

  it("should not infer useInjectComponent return type as ComponentType<any> after register with useValue", () => {
    const container = new Container();
    const BUTTON = container.register(createToken("BUTTON"), {
      useValue: MockComponent,
    });

    function Component() {
      const Button = useInjectComponent(BUTTON);
      type ButtonProps = React.ComponentProps<typeof Button>;

      expectTypeOf(Button).not.toEqualTypeOf<React.ComponentType<any>>();
      expectTypeOf<IsAny<ButtonProps>>().toEqualTypeOf<false>();
      return null;
    }

    void Component;
  });
});
