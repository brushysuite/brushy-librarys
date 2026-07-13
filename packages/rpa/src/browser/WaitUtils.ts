import type { Window } from 'happy-dom';

export async function waitForSelector(window: Window, selector: string, timeout = 5000): Promise<Element> {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const timer = setInterval(() => {
      const el = window.document.querySelector(selector);
      if (el) {
        clearInterval(timer);
        resolve(el);
      } else if (Date.now() - start > timeout) {
        clearInterval(timer);
        reject(new Error(`Timeout waiting for selector ${selector}`));
      }
    }, 50);
  });
}

export async function waitForXPath(window: Window, xpath: string, timeout = 5000): Promise<Node> {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const timer = setInterval(() => {
      const result = window.document.evaluate(xpath, window.document, null, 0, null).iterateNext();
      if (result) {
        clearInterval(timer);
        resolve(result);
      } else if (Date.now() - start > timeout) {
        clearInterval(timer);
        reject(new Error(`Timeout waiting for XPath ${xpath}`));
      }
    }, 50);
  });
}

export async function waitForText(window: Window, text: string, timeout = 5000): Promise<void> {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const timer = setInterval(() => {
      if (window.document.body.textContent?.includes(text)) {
        clearInterval(timer);
        resolve();
      } else if (Date.now() - start > timeout) {
        clearInterval(timer);
        reject(new Error(`Timeout waiting for text ${text}`));
      }
    }, 50);
  });
}
