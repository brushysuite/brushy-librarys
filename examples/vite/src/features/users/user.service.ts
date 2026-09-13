import type { Logger } from "../../shared/logger/logger";

export interface User {
  id: string;
  name: string;
}

export class UserService {
  constructor(private readonly logger: Logger) {}

  list(): User[] {
    this.logger.info("Listing users");
    return [
      { id: "1", name: "Ana" },
      { id: "2", name: "Bruno" },
    ];
  }
}
