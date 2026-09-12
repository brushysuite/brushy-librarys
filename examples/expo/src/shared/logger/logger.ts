export interface Logger {
  info(message: string): void;
}

export class ConsoleLogger implements Logger {
  info(message: string): void {
    console.log(`[brushy-example] ${message}`);
  }
}
