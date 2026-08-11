/** Stable root scope — avoids new object allocation per render */
export const ROOT_SCOPE = Object.freeze({ brushy: "root" as const });

export const DEFAULT_PROMISE_TTL = 5 * 60 * 1000;

export const IS_DEV =
  typeof process !== "undefined"
    ? process.env.NODE_ENV !== "production"
    : false;
