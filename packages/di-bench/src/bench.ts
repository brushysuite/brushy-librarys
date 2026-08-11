import { Container, createToken } from "@brushy/di-core";

class BenchService {
  value = 42;
}

const TOKEN = createToken<BenchService>("BENCH");
const container = new Container();
container.register(TOKEN, { useClass: BenchService });

const WARMUP = 10_000;
const ITERATIONS = 100_000;

for (let i = 0; i < WARMUP; i++) container.resolve(TOKEN);

const start = performance.now();
for (let i = 0; i < ITERATIONS; i++) container.resolve(TOKEN);
const elapsed = performance.now() - start;

const opsPerSec = (ITERATIONS / elapsed) * 1000;
console.log(`resolve singleton: ${opsPerSec.toFixed(0)} ops/s (${ITERATIONS} iterations)`);
console.log(`p95 approx: ${(elapsed / ITERATIONS).toFixed(4)} ms/op`);
