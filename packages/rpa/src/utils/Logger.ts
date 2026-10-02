import fs from 'node:fs';

export interface LogEntry {
  timestamp: number;
  action: string;
  [key: string]: any;
}

export class Logger {
  constructor(private file: string) {}

  log(entry: LogEntry) {
    const line = JSON.stringify({ timestamp: Date.now(), ...entry });
    fs.appendFileSync(this.file, line + '\n');
  }
}
