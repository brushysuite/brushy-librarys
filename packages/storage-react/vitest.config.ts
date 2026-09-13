import { resolve } from "path";
import { defineConfig } from "vitest/config";
import { vitestSwc } from "../../scripts/vitest-swc";

export default defineConfig({
  plugins: [vitestSwc()],
  test: {
    globals: true,
    environment: "jsdom",
    include: ["**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
    exclude: ["**/node_modules/**", "**/dist/**"],
    setupFiles: ["vitest.setup.ts"],
  },
  resolve: {
    dedupe: ["react", "react-dom"],
    alias: {
      react: resolve(__dirname, "../../node_modules/react"),
      "react-dom": resolve(__dirname, "../../node_modules/react-dom"),
    },
  },
});
