import { createStorage } from "@brushy/storage";
import { APP_CACHE } from "./cache.token.js";

export const cacheProviders = [
  {
    provide: APP_CACHE,
    useFactory: () =>
      createStorage({
        id: "brushy-example-express",
        stdTTL: 60,
        checkperiod: 30,
      }),
    lifecycle: "singleton" as const,
  },
];
