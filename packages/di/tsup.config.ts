import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    index: "src/index.ts",
    core: "src/core.ts",
    react: "src/react.ts",
    monitor: "src/monitor.ts",
    otel: "src/otel.ts",
  },
  format: ["cjs", "esm"],
  dts: true,
  sourcemap: true,
  clean: true,
  treeshake: true,
  splitting: false,
  external: [
    "react",
    "@brushy/di-core",
    "@brushy/di-react",
    "@brushy/di-monitor",
    "@brushy/di-otel",
  ],
});
