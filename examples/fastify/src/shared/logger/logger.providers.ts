import { ConsoleLogger } from "./logger.js";
import { LOGGER } from "./logger.token.js";

export const loggerProviders = [
  {
    provide: LOGGER,
    useClass: ConsoleLogger,
    lifecycle: "singleton" as const,
  },
];
