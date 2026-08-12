import { defineConfig } from "vitest/config";
import { resolve } from "path";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["src/**/*.spec.ts"],
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
      exclude: ["src/**/*.spec.ts"],
    },
  },
  resolve: {
    alias: {
      "@brushy/di-core": resolve(__dirname, "../di-core/src/index.ts"),
    },
  },
});
