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
  run(): number;
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
  packageVersions?: Record<string, string>;
}

export interface AggregatedTaskMetrics extends TaskMetrics {
  throughputP50Mean?: number;
  throughputP50Sd?: number;
  throughputCvPct?: number;
  vsBaselinePct?: number;
  vsBrushyPct?: number;
  frameworkRank?: number;
  frameworkIsTop1?: boolean;
  frameworkIsTied?: boolean;
  frameworkGapToSecondPct?: number;
  /** @deprecated Use frameworkRank - baseline is not a DI competitor */
  rank?: number;
  speedupVsBaseline?: number;
  gapToSecondPct?: number;
  isTop1?: boolean;
}

export interface BenchReportMeta {
  isPartialRun: boolean;
  scenariosRun: ScenarioId[];
  allScenariosExpected: boolean;
  tieMarginPct: number;
}

export interface BenchReport {
  environment: BenchEnvironment;
  runs: number;
  meta: BenchReportMeta;
  tasks: TaskMetrics[];
  aggregated: AggregatedTaskMetrics[];
}
