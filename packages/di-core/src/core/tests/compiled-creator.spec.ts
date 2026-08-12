import { describe, expect, it } from "vitest";
import { compileCreator } from "../compiled-creator";
import { createToken } from "../../types/tokens";

const dep = (index: number) => createToken(`DEP_${index}`);

describe("compileCreator", () => {
  const deps = Array.from({ length: 7 }, (_, index) => dep(index));
  const resolved = new Map(deps.map((token, index) => [token, `d${index}`]));
  const resolve = (token: ReturnType<typeof dep>) => resolved.get(token);

  it("should compile useValue providers", () => {
    const creator = compileCreator({ useValue: 42 });
    expect(creator?.({} as never)).toBe(42);
  });

  it("should compile class providers for arities 0 through 6+", () => {
    for (let count = 0; count <= 6; count++) {
      class DynamicClass {
        constructor(...args: unknown[]) {
          (this as { args: unknown[] }).args = args;
        }
      }

      const creator = compileCreator({
        useClass: DynamicClass,
        dependencies: deps.slice(0, count),
      });

      const instance = creator?.(resolve) as { args: unknown[] };
      expect(instance.args).toHaveLength(count);
      expect(instance.args).toEqual(Array.from({ length: count }, (_, index) => `d${index}`));
    }
  });

  it("should compile factory providers for arities 0 through 6+", () => {
    const numericResolved = new Map(deps.map((token, index) => [token, index]));

    for (let count = 0; count <= 6; count++) {
      const creator = compileCreator({
        useFactory: (...args: number[]) => args.reduce((sum, value) => sum + value, 0),
        dependencies: deps.slice(0, count),
      });

      const expected = Array.from({ length: count }, (_, index) => index).reduce(
        (sum, value) => sum + value,
        0,
      );

      expect(creator?.((token) => numericResolved.get(token))).toBe(expected);
    }
  });

  it("should return undefined for invalid provider configs", () => {
    expect(compileCreator({})).toBeUndefined();
  });
});
