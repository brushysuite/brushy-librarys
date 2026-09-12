import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";
import { vitestReactAlias, vitestReactDeps } from "../../scripts/vitest-react-alias";
import { vitestSwc } from "../../scripts/vitest-swc";

const packageDir = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [vitestSwc()],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["src/test/setup.ts"],
    include: ["src/**/*.spec.{ts,tsx}"],
    ...vitestReactDeps,
  },
  resolve: vitestReactAlias(packageDir),
});
