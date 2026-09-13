import { IS_DEV } from "./constants";

const noop = () => {};

const COLORS = {
  info: "\x1b[32m",
  debug: "\x1b[36m",
  warn: "\x1b[33m",
  error: "\x1b[31m",
  token: "\x1b[35m",
  class: "\x1b[33;1m",
  lifecycle: "\x1b[36;1m",
  reset: "\x1b[0m",
} as const;

export class Logger {
  private static enabled = IS_DEV;
  private static lastMessages = new Map<string, number>();
  private static readonly MIN_INTERVAL_MS = 200;

  static setEnabled(enabled: boolean): void {
    Logger.enabled = enabled;
  }

  static formatToken(token: string): string {
    return `${COLORS.token}${token}${COLORS.reset}`;
  }

  static formatClass(className: string): string {
    return `${COLORS.class}${className}${COLORS.reset}`;
  }

  static formatLifecycle(lifecycle: string): string {
    return `${COLORS.lifecycle}${lifecycle}${COLORS.reset}`;
  }

  static formatType(type: string): string {
    return `\x1b[36m${type}\x1b[0m`;
  }

  static info(message: string): void {
    if (!Logger.enabled || Logger.isDuplicate("info", message)) return;
    console.info(`${COLORS.info}[INFO]${COLORS.reset} ${message}`);
  }

  static debug(message: string): void {
    if (!Logger.enabled || Logger.isDuplicate("debug", message)) return;
    console.log(`${COLORS.debug}[DEBUG]${COLORS.reset} ${message}`);
  }

  static warn(message: string): void {
    if (!Logger.enabled || Logger.isDuplicate("warn", message)) return;
    console.warn(`${COLORS.warn}[WARN]${COLORS.reset} ${message}`);
  }

  static error(message: string): void {
    if (!Logger.enabled || Logger.isDuplicate("error", message)) return;
    console.error(`${COLORS.error}[ERROR]${COLORS.reset} ${message}`);
  }

  private static isDuplicate(level: string, message: string): boolean {
    const key = `${level}:${message}`;
    const current = Date.now();
    const last = Logger.lastMessages.get(key) ?? 0;

    if (current - last < Logger.MIN_INTERVAL_MS) return true;

    Logger.lastMessages.set(key, current);
    return false;
  }
}

export const silentLogger = {
  info: noop,
  debug: noop,
  warn: noop,
  error: noop,
};
