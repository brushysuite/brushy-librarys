#!/usr/bin/env node
/**
 * Smoke test: validates react-native fields and ESM entry points for Metro.
 */
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const packages = [
  "packages/di-core/package.json",
  "packages/di-react/package.json",
  "packages/di/package.json",
  "packages/storage-react/package.json",
];

let failed = false;

for (const pkgPath of packages) {
  const full = resolve(pkgPath);
  const pkg = JSON.parse(readFileSync(full, "utf8"));
  const rnEntry = pkg["react-native"] ?? pkg.module ?? pkg.main;

  if (!rnEntry) {
    console.error(`FAIL: ${pkg.name} missing react-native/main entry`);
    failed = true;
    continue;
  }

  const distFile = resolve(pkgPath, "..", rnEntry);
  if (!existsSync(distFile)) {
    console.error(`FAIL: ${pkg.name} entry not built: ${rnEntry}`);
    failed = true;
    continue;
  }

  console.log(`OK: ${pkg.name} -> ${rnEntry}`);
}

process.exit(failed ? 1 : 0);
