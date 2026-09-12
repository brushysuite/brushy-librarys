import { existsSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";

function resolvePackageDir(packageDir: string, name: string): string {
  const localManifest = join(packageDir, "node_modules", name, "package.json");

  if (existsSync(localManifest)) {
    return dirname(localManifest);
  }

  const require = createRequire(join(packageDir, "package.json"));
  return dirname(require.resolve(`${name}/package.json`));
}

/**
 * Resolve React packages from a workspace directory so Vitest does not pick
 * mismatched versions hoisted at the monorepo root (e.g. from Expo).
 */
export function vitestReactAlias(packageDir: string) {
  const reactDir = resolvePackageDir(packageDir, "react");
  const reactDomDir = resolvePackageDir(packageDir, "react-dom");

  return {
    dedupe: ["react", "react-dom"],
    alias: {
      react: reactDir,
      "react-dom": reactDomDir,
    },
  };
}

export const vitestReactDeps = {
  server: {
    deps: {
      inline: [
        "react",
        "react-dom",
        "@testing-library/react",
        "@testing-library/jest-dom",
        "@testing-library/dom",
      ],
    },
  },
};
