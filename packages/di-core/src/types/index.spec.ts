import { describe, expect, it } from "vitest";
import type { ProviderConfig } from "./index";
import { createToken, deps } from "./index";

describe("types index exports", () => {
  it("should re-export token helpers and provider config types", () => {
    const TOKEN = createToken<string>("EXPORTED");
    const config: ProviderConfig<string> = {
      useFactory: () => "ok",
      dependencies: deps([TOKEN]),
    };

    expect(config.dependencies).toEqual([TOKEN]);
    expect(createToken("OTHER")).toBeDefined();
  });
});
