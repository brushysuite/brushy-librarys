import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

export default defineConfig({
  plugins: [react()],
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
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
      react: resolve(__dirname, "../../node_modules/react"),
      "react-dom": resolve(__dirname, "../../node_modules/react-dom"),
    },
    dedupe: ["react", "react-dom"],
  },
});
