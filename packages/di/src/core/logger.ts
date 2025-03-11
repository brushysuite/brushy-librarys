/**
 * DI System Logger with colored log formatting
 */
export class Logger {
  private static lastMessages: Record<string, number> = {};
  private static MIN_INTERVAL_MS = 200; // Minimum interval between identical messages

  private static readonly COLORS = {
    info: "\x1b[32m", // Green
    debug: "\x1b[36m", // Cyan
    warn: "\x1b[33m", // Yellow
    error: "\x1b[31m", // Red
    token: "\x1b[35m", // Magenta for tokens
    class: "\x1b[33;1m", // Bright yellow for classes
    lifecycle: "\x1b[36;1m", // Bright cyan for lifecycle
    reset: "\x1b[0m", // Reset
  };

  static formatToken(token: string): string {
    return `${this.COLORS.token}${token}${this.COLORS.reset}`;
  }

  static formatClass(className: string): string {
    return `${this.COLORS.class}${className}${this.COLORS.reset}`;
  }

  static formatLifecycle(lifecycle: string): string {
    return `${this.COLORS.lifecycle}${lifecycle}${this.COLORS.reset}`;
  }

  static formatType(type: string): string {
    return `\x1b[36m${type}\x1b[0m`;
  }

  static info(message: string): void {
    if (this.isDuplicate("info", message)) return;
    console.info(`${this.COLORS.info}[INFO]${this.COLORS.reset} ${message}`);
  }

  static debug(message: string): void {
    if (this.isDuplicate("debug", message)) return;
    console.log(`${this.COLORS.debug}[DEBUG]${this.COLORS.reset} ${message}`);
  }

  static warn(message: string): void {
    if (this.isDuplicate("warn", message)) return;
    console.warn(`${this.COLORS.warn}[WARN]${this.COLORS.reset} ${message}`);
  }

  static error(message: string): void {
    if (this.isDuplicate("error", message)) return;
    console.error(`${this.COLORS.error}[ERROR]${this.COLORS.reset} ${message}`);
  }

  private static isDuplicate(level: string, message: string): boolean {
    const key = `${level}:${message}`;
    const now = Date.now();
    const lastTime = this.lastMessages[key] || 0;

    if (now - lastTime < this.MIN_INTERVAL_MS) {
      return true;
    }

    this.lastMessages[key] = now;
    return false;
  }
}
