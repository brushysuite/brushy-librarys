import { defineConfig } from "vitest/config";
import { vitestSwc } from "../../scripts/vitest-swc";

export default defineConfig({
  plugins: [vitestSwc()],
  test: {
    include: ["src/**/*.test.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json-summary"],
      thresholds: {
        lines: 100,
        branches: 100,
        functions: 100,
        statements: 100,
      },
      include: ["src/**/*.ts"],
      exclude: ["src/**/*.test.ts"],
    },
  },
});
