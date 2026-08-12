import { describe, expect, it, vi } from "vitest";
import { ContainerEventBus } from "../events";

describe("ContainerEventBus", () => {
  it("should no-op when emitting without listeners", () => {
    const bus = new ContainerEventBus();

    expect(() =>
      bus.emit({
        type: "resolve",
        token: "TOKEN",
        details: { success: true },
        timestamp: Date.now(),
      }),
    ).not.toThrow();
  });

  it("should swallow listener errors", () => {
    const bus = new ContainerEventBus();
    const healthy = vi.fn();

    bus.subscribe(() => {
      throw new Error("observer failed");
    });
    bus.subscribe(healthy);

    bus.emit({
      type: "error",
      token: "TOKEN",
      details: { message: "boom" },
      timestamp: Date.now(),
    });

    expect(healthy).toHaveBeenCalledTimes(1);
  });
});
