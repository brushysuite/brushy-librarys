import { createToken } from "@brushy/di-core";
import type { ConsoleLogger } from "./logger";

export const LOGGER = createToken<ConsoleLogger>("LOGGER");
