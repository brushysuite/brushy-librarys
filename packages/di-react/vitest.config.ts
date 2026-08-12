import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: "jsdom",
    include: ["src/**/*.spec.ts", "src/**/*.spec.tsx", "src/__tests__/**/*.spec.tsx"],
    setupFiles: ["src/__tests__/setup.ts"],
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
    dedupe: ["react", "react-dom"],
    alias: {
      "@brushy/di-core": resolve(__dirname, "../di-core/src/index.ts"),
      react: resolve(__dirname, "../../node_modules/react"),
      "react-dom": resolve(__dirname, "../../node_modules/react-dom"),
    },
  },
});
