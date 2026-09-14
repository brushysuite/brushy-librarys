import fs from 'node:fs';
import yaml from 'js-yaml';
import type { RPA } from '../RPA';

export class DSLRunner {
  constructor(private rpa: RPA) {}

  async runFlow(filePath: string) {
    const content = fs.readFileSync(filePath, 'utf8');
    const actions = yaml.load(content) as any[];
    if (!Array.isArray(actions)) return;
    for (const step of actions) {
      const [action, params] = Object.entries(step)[0];
      switch (action) {
        case 'navigate':
          await this.rpa.open(params as string);
          break;
        case 'click':
          await this.rpa.click(params as string);
          break;
        case 'type':
          await this.rpa.type((params as any).selector, (params as any).value);
          break;
        case 'waitForSelector':
          await this.rpa.waitForSelector(params as string, (step as any).timeout);
          break;
        case 'waitForXPath':
          await this.rpa.waitForXPath(params as string, (step as any).timeout);
          break;
        case 'waitForText':
          await this.rpa.waitForText(params as string, (step as any).timeout);
          break;
        case 'screenshot':
          await this.rpa.screenshot(params as string);
          break;
        default:
          break;
      }
    }
  }
}
