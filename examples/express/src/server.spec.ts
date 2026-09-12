import { afterEach, describe, expect, it, vi } from "vitest";

const listen = vi.fn((_port: number, callback: () => void) => {
  callback();
});

vi.mock("./app.js", () => ({
  createApp: () => ({ listen }),
}));

describe("server", () => {
  afterEach(() => {
    vi.resetModules();
    listen.mockClear();
  });

  it("listens on port 3001", async () => {
    await import("./server.js");

    expect(listen).toHaveBeenCalledWith(3001, expect.any(Function));
  });
});
