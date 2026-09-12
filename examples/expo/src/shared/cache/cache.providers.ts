import { createStorage } from "@brushy/storage";
import { APP_CACHE } from "./cache.token";

export const cacheProviders = [
  {
    provide: APP_CACHE,
    useFactory: () =>
      createStorage({
        id: "brushy-example-expo",
        stdTTL: 60,
        checkperiod: 30,
      }),
    lifecycle: "singleton" as const,
  },
];
