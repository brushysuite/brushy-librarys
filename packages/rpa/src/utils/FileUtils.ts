import fs from 'node:fs';
import path from 'node:path';
import type { Window } from 'happy-dom';

export class FileUtils {
  constructor(private window: Window) {}

  uploadFile(selector: string, filePath: string) {
    const input = this.window.document.querySelector(selector) as HTMLInputElement | null;
    if (input && input.type === 'file') {
      (input as any).files = [filePath];
      input.value = filePath;
    }
  }

  captureDownloads(dir: string) {
    const { document } = this.window;
    document.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'A' && (target as HTMLAnchorElement).download) {
        const href = (target as HTMLAnchorElement).getAttribute('href');
        if (href) {
          const filename = path.basename(href);
          fs.writeFileSync(path.join(dir, filename), '');
        }
      }
    });
  }
}
