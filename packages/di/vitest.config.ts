import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";
import { vitestReactAlias, vitestReactDeps } from "../../scripts/vitest-react-alias";
import { vitestSwc } from "../../scripts/vitest-swc";

const packageDir = dirname(fileURLToPath(import.meta.url));
const reactResolve = vitestReactAlias(packageDir);

export default defineConfig({
  plugins: [vitestSwc()],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    testTimeout: 30000,
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
      exclude: [
        "**/node_modules/**",
        "**/dist/**",
        "src/test/**",
        "**/coverage/**",
        "tsup.config.ts",
        "vitest.config.ts",
        "src/lib/@types/**",
        "**/*.d.ts",
      ],
    },
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    ...vitestReactDeps,
  },
  resolve: {
    ...reactResolve,
    alias: {
      ...reactResolve.alias,
      "@": resolve(packageDir, "./src"),
    },
  },
});
