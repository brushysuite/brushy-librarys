/** Stable root scope - avoids new object allocation per render */
export const ROOT_SCOPE = Object.freeze({ brushy: "root" as const });

export const DEFAULT_PROMISE_TTL = 5 * 60 * 1000;

export function isDev(): boolean {
  const globalRef = globalThis as { __DEV__?: boolean };

  if (typeof globalRef.__DEV__ === "boolean") {
    return globalRef.__DEV__;
  }

  if (typeof process !== "undefined" && process.env?.NODE_ENV) {
    return process.env.NODE_ENV !== "production";
  }

  return false;
}

export function isNodeDev(): boolean {
  return typeof process !== "undefined" && process.env?.NODE_ENV === "development";
}

export const IS_DEV = isDev();
