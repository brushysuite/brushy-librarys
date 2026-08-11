import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: "jsdom",
    include: ["src/**/*.spec.ts", "src/**/*.spec.tsx", "src/__tests__/**/*.spec.tsx"],
  },
  resolve: {
    alias: {
      "@brushy/di-core": resolve(__dirname, "../di-core/src/index.ts"),
    },
  },
});
