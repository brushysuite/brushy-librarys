import { VM } from 'vm2';
import { Window } from 'happy-dom';

export class DomEngine {
  window: Window;

  constructor(html: string) {
    this.window = new Window();
    this.window.document.write(html);
  }

  executeScripts() {
    const scripts = this.window.document.querySelectorAll('script');
    scripts.forEach((script) => {
      if (script.textContent) {
        const vm = new VM({ sandbox: { window: this.window } });
        vm.run(script.textContent);
      }
    });
  }
}
