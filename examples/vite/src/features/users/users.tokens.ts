import { createToken } from "@brushy/di-core";
import type { UserList } from "./ui/user-list";
import type { UserService } from "./user.service";

export const USER_SERVICE = createToken<UserService>("USER_SERVICE");
export const USER_LIST = createToken<typeof UserList>("USER_LIST");
