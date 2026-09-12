import { Container } from "@brushy/di-core";
import { createUsersProviders, usersUiProviders } from "../features/users/users.providers";
import { cacheProviders } from "../shared/cache/cache.providers";
import { loggerProviders } from "../shared/logger/logger.providers";

type ContainerProviders = NonNullable<ConstructorParameters<typeof Container>[0]>["providers"];

export const container = new Container({
  name: "web",
  providers: [
    ...loggerProviders,
    ...cacheProviders,
    ...createUsersProviders("singleton"),
    ...usersUiProviders,
  ] as ContainerProviders,
});
