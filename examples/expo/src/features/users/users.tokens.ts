import { createToken } from "@brushy/di-core";
import type { FC } from "react";
import type { UserListProps } from "./ui/user-list";
import type { UserService } from "./user.service";

export const USER_SERVICE = createToken<UserService>("USER_SERVICE");
export const USER_LIST = createToken<FC<UserListProps>>("USER_LIST");
export const USERS_CARD = createToken<FC>("USERS_CARD");
