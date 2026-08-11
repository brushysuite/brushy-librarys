export type ScenarioId =
  | "singleton_cold"
  | "singleton_warm"
  | "transient"
  | "deep_graph"
  | "wide_graph"
  | "factory_deps"
  | "register_batch"
  | "request_scope";

export const ALL_SCENARIOS: ScenarioId[] = [
  "singleton_cold",
  "singleton_warm",
  "transient",
  "deep_graph",
  "wide_graph",
  "factory_deps",
  "register_batch",
  "request_scope",
];

export const ALL_LIB_IDS = [
  "brushy",
  "tsyringe",
  "inversify",
  "awilix",
  "baseline",
] as const;

export type LibId = (typeof ALL_LIB_IDS)[number];

export interface BenchScenario {
  setup(): void;
  run(): void;
  teardown(): void;
}

export interface BenchAdapter {
  readonly id: LibId;
  readonly label: string;
  supports(scenario: ScenarioId): boolean;
  createScenario(scenario: ScenarioId): BenchScenario;
}

export interface TaskMetrics {
  lib: LibId;
  libLabel: string;
  scenario: ScenarioId;
  runIndex: number;
  throughputMean: number;
  throughputP50: number;
  latencyMeanNs: number;
  latencyP50Ns: number;
  latencyP75Ns: number;
  latencyP99Ns: number;
  latencyMinNs: number;
  latencyMaxNs: number;
  latencySdNs: number;
  latencyMoeNs: number;
  latencyRme: number;
  samplesCount: number;
  error?: string;
}

export interface BenchEnvironment {
  node: string;
  platform: string;
  arch: string;
  cpuCount: number;
  cpuModel: string;
  date: string;
  benchConfig: {
    timeMs: number;
    runs: number;
    scenarios: string;
    libs: string;
  };
}

export interface AggregatedTaskMetrics extends TaskMetrics {
  throughputP50Mean?: number;
  throughputP50Sd?: number;
  vsBaselinePct?: number;
  vsBrushyPct?: number;
  rank?: number;
  speedupVsBaseline?: number;
}

export interface BenchReport {
  environment: BenchEnvironment;
  runs: number;
  tasks: TaskMetrics[];
  aggregated: AggregatedTaskMetrics[];
}
