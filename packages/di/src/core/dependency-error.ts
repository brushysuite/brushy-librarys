import { Logger } from "./logger";

export class DependencyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BrushyDependencyError";
    Logger.error(message);
  }
}
