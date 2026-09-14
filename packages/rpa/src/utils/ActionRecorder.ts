import fs from 'node:fs';
import yaml from 'js-yaml';

export interface ActionEntry {
  action: string;
  [key: string]: any;
}

export class ActionRecorder {
  private actions: ActionEntry[] = [];
  private path?: string;

  startRecording(path: string) {
    this.path = path;
    this.actions = [];
  }

  record(entry: ActionEntry) {
    if (this.path) {
      this.actions.push(entry);
    }
  }

  stopRecording() {
    if (!this.path) return;
    const data = yaml.dump(this.actions);
    fs.writeFileSync(this.path, data);
    this.path = undefined;
    this.actions = [];
  }

  async replay(path: string, runner: (entry: ActionEntry) => Promise<void>) {
    const content = fs.readFileSync(path, 'utf8');
    const actions = yaml.load(content) as ActionEntry[];
    if (!Array.isArray(actions)) return;
    for (const act of actions) {
      await runner(act);
    }
  }
}
