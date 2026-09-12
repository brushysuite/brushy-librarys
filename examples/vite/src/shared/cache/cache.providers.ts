import { createStorage } from "@brushy/storage";
import { APP_CACHE } from "./cache.token";

export const cacheProviders = [
  {
    provide: APP_CACHE,
    useFactory: () =>
      createStorage({
        id: "brushy-example-vite",
        prefix: "@brushy-example:",
        persist: "local",
      }),
    lifecycle: "singleton" as const,
  },
];
