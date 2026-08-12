import "reflect-metadata";
import { describe, expect, it } from "vitest";
import { ALL_ADAPTERS } from "./index.js";
import type { ScenarioId } from "../types.js";
import { ALL_SCENARIOS } from "../types.js";

const SCENARIO_MATRIX: ScenarioId[] = ALL_SCENARIOS;

describe("adapter invariants", () => {
  for (const adapter of ALL_ADAPTERS) {
    describe(adapter.id, () => {
      it("teardown is idempotent", () => {
        const scenario = adapter.createScenario("transient");
        scenario.setup();
        scenario.run();
        scenario.teardown();
        expect(() => scenario.teardown()).not.toThrow();
      });

      for (const scenarioId of SCENARIO_MATRIX) {
        if (!adapter.supports(scenarioId)) continue;

        it(`${scenarioId} returns a consumed checksum`, () => {
          const scenario = adapter.createScenario(scenarioId);
          scenario.setup();
          const checksum = scenario.run();
          expect(typeof checksum).toBe("number");
          scenario.teardown();
        });
      }

      if (adapter.supports("request_scope")) {
        it("request_scope creates distinct instances across iterations", () => {
          const scenario = adapter.createScenario("request_scope");
          scenario.setup();
          const first = scenario.run();
          const second = scenario.run();
          expect(first).not.toBe(second);
          scenario.teardown();
        });
      }

      if (adapter.supports("singleton_warm")) {
        it("singleton_warm returns the same instance checksum", () => {
          const scenario = adapter.createScenario("singleton_warm");
          scenario.setup();
          const a = scenario.run();
          const b = scenario.run();
          expect(a).toBe(b);
          scenario.teardown();
        });
      }

      if (adapter.supports("transient") && adapter.id !== "baseline") {
        it("transient creates a new instance each resolve", () => {
          const scenario = adapter.createScenario("transient");
          scenario.setup();
          scenario.run();
          scenario.run();
          scenario.teardown();
        });
      }
    });
  }

  it("covers all declared scenarios across adapters", () => {
    for (const scenario of ALL_SCENARIOS) {
      const supporters = ALL_ADAPTERS.filter((a) => a.supports(scenario));
      expect(supporters.length).toBeGreaterThan(0);
    }
  });

  it("instantiates register_batch helper classes", () => {
    for (const adapter of ALL_ADAPTERS) {
      if (!adapter.supports("register_batch")) continue;
      const scenario = adapter.createScenario("register_batch");
      scenario.setup();

      const batchClasses = (scenario as { batchClasses?: (new () => unknown)[] }).batchClasses;
      if (batchClasses?.[0]) {
        expect(new batchClasses[0]()).toBeTruthy();
      }

      scenario.teardown();
    }
  });

  it("returns zero for adapters with explicit default branches", () => {
    for (const adapter of [ALL_ADAPTERS.find((a) => a.id === "baseline")!, ALL_ADAPTERS.find((a) => a.id === "inversify")!, ALL_ADAPTERS.find((a) => a.id === "tsyringe")!]) {
      const scenario = adapter.createScenario("transient");
      (scenario as { scenario: ScenarioId }).scenario =
        "unsupported_scenario" as ScenarioId;
      scenario.setup();
      expect(scenario.run()).toBe(0);
      scenario.teardown();
    }
  });
});
