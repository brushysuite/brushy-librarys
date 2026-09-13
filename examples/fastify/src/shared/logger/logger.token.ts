import { createToken } from "@brushy/di-core";
import type { ConsoleLogger } from "./logger.js";

export const LOGGER = createToken<ConsoleLogger>("LOGGER");
