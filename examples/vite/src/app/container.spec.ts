import { describe, expect, it } from "vitest";
import { USER_SERVICE } from "../features/users/users.tokens";
import { container } from "./container";

describe("container", () => {
  it("resolves USER_SERVICE", () => {
    const users = container.resolve(USER_SERVICE);

    expect(users.list()).toEqual([
      { id: "1", name: "Ana" },
      { id: "2", name: "Bruno" },
    ]);
  });
});
