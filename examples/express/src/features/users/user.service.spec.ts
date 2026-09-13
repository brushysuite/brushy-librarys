import { createStorage } from "@brushy/storage";
import { describe, expect, it, vi } from "vitest";
import type { Logger } from "../../shared/logger/logger.js";
import { UserService } from "./user.service.js";

describe("UserService", () => {
  it("caches users after the first list call", () => {
    const logger: Logger = { info: vi.fn() };
    const cache = createStorage();
    const service = new UserService(logger, cache);

    expect(service.list()).toEqual([
      { id: "1", name: "Ana" },
      { id: "2", name: "Bruno" },
    ]);
    expect(logger.info).toHaveBeenCalledWith("Listing users (cache miss)");

    expect(service.list()).toEqual([
      { id: "1", name: "Ana" },
      { id: "2", name: "Bruno" },
    ]);
    expect(logger.info).toHaveBeenCalledWith("Listing users (cache hit)");
  });
});
