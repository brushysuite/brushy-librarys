import { Container } from "@brushy/di-core";
import { createUsersProviders } from "../features/users/users.providers.js";
import { cacheProviders } from "../shared/cache/cache.providers.js";
import { loggerProviders } from "../shared/logger/logger.providers.js";

export const container = new Container({
  name: "server",
  providers: [...loggerProviders, ...cacheProviders, ...createUsersProviders("scoped")],
});
