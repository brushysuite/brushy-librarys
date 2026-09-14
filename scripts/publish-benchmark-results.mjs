#!/usr/bin/env node
/**
 * Commits published di-bench artifacts when they change.
 * Used by .github/workflows/benchmark.yml after a full suite run.
 */
import { execFileSync } from "node:child_process";

const RESULTS = "packages/di-bench/results";
const PUBLISHED = [
  `${RESULTS}/latest.json`,
  `${RESULTS}/latest.md`,
  `${RESULTS}/latest.csv`,
  `${RESULTS}/BENCHMARK.md`,
];

function run(cmd, args = []) {
  execFileSync(cmd, args, { stdio: "inherit" });
}

run("git", ["config", "user.name", "github-actions[bot]"]);
run("git", ["config", "user.email", "github-actions[bot]@users.noreply.github.com"]);

for (const file of PUBLISHED) {
  run("git", ["add", file]);
}

const diff = execFileSync("git", ["diff", "--staged", "--name-only"], {
  encoding: "utf8",
}).trim();
if (!diff) {
  console.log("No benchmark changes to commit.");
  process.exit(0);
}

run("git", ["commit", "-m", "chore(di-bench): update published benchmark results [skip ci]"]);
run("git", ["push"]);
