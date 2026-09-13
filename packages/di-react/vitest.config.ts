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
    include: ["src/**/*.spec.ts", "src/**/*.spec.tsx", "src/__tests__/**/*.spec.tsx"],
    setupFiles: ["src/__tests__/setup.ts"],
    ...vitestReactDeps,
    coverage: {
      provider: "v8",
      reporter: ["text", "json-summary"],
      thresholds: {
        lines: 100,
        branches: 100,
        functions: 100,
        statements: 100,
      },
      include: ["src/**/*.{ts,tsx}"],
      exclude: ["src/**/*.spec.ts", "src/**/*.spec.tsx", "src/__tests__/**"],
    },
  },
  resolve: {
    ...reactResolve,
    alias: {
      ...reactResolve.alias,
      "@brushy/di-core": resolve(packageDir, "../di-core/src/index.ts"),
    },
  },
});
