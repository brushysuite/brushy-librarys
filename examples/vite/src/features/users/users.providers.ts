import type { Lifecycle } from "@brushy/di-core";
import { LOGGER } from "../../shared/logger/logger.token";
import { UserList } from "./ui/user-list";
import { UserService } from "./user.service";
import { USER_LIST, USER_SERVICE } from "./users.tokens";

export function createUsersProviders(lifecycle: Lifecycle) {
  return [
    {
      provide: USER_SERVICE,
      useClass: UserService,
      dependencies: [LOGGER],
      lifecycle,
    },
  ];
}

export const usersUiProviders = [
  {
    provide: USER_LIST,
    useValue: UserList,
  },
];
