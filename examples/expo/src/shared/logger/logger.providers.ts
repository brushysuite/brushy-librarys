import { ConsoleLogger } from "./logger";
import { LOGGER } from "./logger.token";

export const loggerProviders = [
  {
    provide: LOGGER,
    useClass: ConsoleLogger,
    lifecycle: "singleton" as const,
  },
];
