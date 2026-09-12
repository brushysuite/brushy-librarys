import type { Lifecycle } from "@brushy/di-core";
import { APP_CACHE } from "../../shared/cache/cache.token.js";
import { LOGGER } from "../../shared/logger/logger.token.js";
import { UserService } from "./user.service.js";
import { USER_SERVICE } from "./users.tokens.js";

export function createUsersProviders(lifecycle: Lifecycle) {
  return [
    {
      provide: USER_SERVICE,
      useClass: UserService as new (...args: unknown[]) => unknown,
      dependencies: [LOGGER, APP_CACHE],
      lifecycle,
    },
  ];
}
