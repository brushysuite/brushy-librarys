import { IS_DEV } from "./constants";
import { Logger } from "./logger";

export class DependencyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BrushyDependencyError";
    if (IS_DEV) Logger.error(message);
  }
}
