import { createToken } from "@brushy/di-core";
import type { Storage } from "@brushy/storage";

export const APP_CACHE = createToken<Storage>("APP_CACHE");
