import type { Lifecycle } from "@brushy/di-core";
import { APP_CACHE } from "../../shared/cache/cache.token";
import { LOGGER } from "../../shared/logger/logger.token";
import { UserList } from "./ui/user-list";
import { UsersCard } from "./ui/users-card";
import { UserService } from "./user.service";
import { USER_LIST, USER_SERVICE, USERS_CARD } from "./users.tokens";

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

export const usersUiProviders = [
  {
    provide: USER_LIST,
    useValue: UserList,
  },
  {
    provide: USERS_CARD,
    useValue: UsersCard,
  },
];
