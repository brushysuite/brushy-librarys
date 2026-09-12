import type { Storage } from "@brushy/storage";
import type { Logger } from "../../shared/logger/logger";

export interface User {
  id: string;
  name: string;
}

const USERS_CACHE_KEY = "users:list";

export class UserService {
  constructor(
    private readonly logger: Logger,
    private readonly cache: Storage,
  ) {}

  list(): User[] {
    const cached = this.cache.get<User[]>(USERS_CACHE_KEY);
    if (cached) {
      this.logger.info("Listing users (cache hit)");
      return cached;
    }

    this.logger.info("Listing users (cache miss)");
    const users = [
      { id: "1", name: "Ana" },
      { id: "2", name: "Bruno" },
    ];
    this.cache.set(USERS_CACHE_KEY, users, 30);
    return users;
  }
}
