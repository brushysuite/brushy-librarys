export class BenchService {
  value = 42;
}

export class Config {
  url = "http://localhost";
}

export class Logger {
  log(_message: string): void {
    /* noop */
  }
}

export class NodeA {
  value = 1;
}

export class NodeB {
  constructor(public readonly a: NodeA) {}
}

export class NodeC {
  constructor(public readonly b: NodeB) {}
}

export class NodeD {
  constructor(public readonly c: NodeC) {}
}

export class NodeE {
  constructor(public readonly d: NodeD) {}
}

export class HubService {
  constructor(
    public readonly a: NodeA,
    public readonly b: NodeB,
    public readonly c: NodeC,
    public readonly d: NodeD,
    public readonly e: NodeE,
  ) {}
}

export class FactoryService {
  constructor(
    public readonly logger: Logger,
    public readonly config: Config,
  ) {}
}

export class ScopedService {
  id = Math.random();
}

export const BATCH_COUNT = 50;
