import { resolve } from "path";
import swc from "unplugin-swc";

const swcConfigPath = resolve(__dirname, "../.swcrc");

export function vitestSwc() {
  return swc.vite({
    configFile: swcConfigPath,
  });
}
