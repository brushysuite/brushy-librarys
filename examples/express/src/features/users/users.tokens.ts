import { createToken } from "@brushy/di-core";
import type { UserService } from "./user.service.js";

export const USER_SERVICE = createToken<UserService>("USER_SERVICE");
