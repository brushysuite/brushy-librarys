import { defineConfig } from "vitest/config";
import { vitestSwc } from "../../scripts/vitest-swc";

export default defineConfig({
  plugins: [vitestSwc()],
  test: {
    globals: true,
    environment: "node",
    testTimeout: 10000,
    hookTimeout: 10000,
    include: ["**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
    exclude: ["**/node_modules/**", "**/dist/**"],
    setupFiles: ["vitest.setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "json-summary"],
      include: ["src/**/*.{ts,tsx}"],
      exclude: ["src/**/*.spec.ts", "src/**/*.test.ts"],
    },
  },
});
