import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/bench.ts"],
  format: ["esm"],
  clean: true,
  external: ["@brushy/di-core"],
});
