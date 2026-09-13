import { defineConfig } from "vitest/config";
import { vitestSwc } from "../../scripts/vitest-swc";

export default defineConfig({
  plugins: [vitestSwc()],
  test: {
    globals: true,
    environment: "node",
    setupFiles: ["src/test/setup.ts"],
    include: ["src/**/*.spec.{ts,tsx}"],
  },
});
