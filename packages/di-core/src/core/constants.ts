/** Stable root scope — avoids new object allocation per render */
export const ROOT_SCOPE = Object.freeze({ brushy: "root" as const });

export const DEFAULT_PROMISE_TTL = 5 * 60 * 1000;

function detectDevMode(): boolean {
  const globalRef = globalThis as { __DEV__?: boolean };

  if (typeof globalRef.__DEV__ === "boolean") {
    return globalRef.__DEV__;
  }

  if (typeof process !== "undefined" && process.env?.NODE_ENV) {
    return process.env.NODE_ENV !== "production";
  }

  return false;
}

export const IS_DEV = detectDevMode();
