import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    index: "src/index.ts",
    container: "src/entries/container.ts",
    cache: "src/entries/cache.ts",
    resolve: "src/entries/resolve.ts",
    inject: "src/entries/inject.ts",
    server: "src/entries/server.ts",
    "request-scope": "src/entries/request-scope.ts",
  },
  format: ["cjs", "esm"],
  dts: true,
  sourcemap: true,
  clean: true,
  treeshake: true,
  splitting: false,
});
