import { BrowserSession } from './browser/BrowserSession';
import { BrowserPage } from './browser/BrowserPage';
import { CacheManager } from './cache/CacheManager';
import { ResourceFetcher } from './http/ResourceFetcher';
import { waitForSelector, waitForXPath, waitForText } from './browser/WaitUtils';
import { Logger } from './utils/Logger';
import { DSLRunner } from './utils/DSLRunner';
import { ActionRecorder, ActionEntry } from './utils/ActionRecorder';
import { EventEmitter } from './utils/EventEmitter';
import { compareScreenshots } from './utils/VisualDiff';
import type { RPAOptions } from './types';

export class RPA {
  private session: BrowserSession;
  private cache: CacheManager;
  private fetcher: ResourceFetcher;
  private logger?: Logger;
  private recorder: ActionRecorder = new ActionRecorder();
  private emitter: EventEmitter = new EventEmitter();

  constructor(private options: RPAOptions = {}) {
    this.cache = new CacheManager('.cache', options.cacheTTL ?? 60_000);
    this.fetcher = new ResourceFetcher(this.cache);
    this.session = new BrowserSession();
    if (options.enableLogs) {
      const path = options.logPath ?? 'rpa.log.json';
      this.logger = new Logger(path);
    }
  }

  on(event: string, cb: (payload: any) => void) {
    this.emitter.on(event, cb);
  }

  private logAction(entry: ActionEntry) {
    this.logger?.log(entry);
    this.recorder.record(entry);
    this.emitter.emit(entry.action, entry);
  }

  async newPage(url: string) {
    const page = new BrowserPage(this.fetcher);
    await page.open(url);
    this.session.add(page);
    this.logAction({ action: 'navigate', url });
    return page;
  }

  async open(url: string) {
    const page = await this.newPage(url);
    this.session.setCurrent(page);
  }

  private current(): BrowserPage {
    const page = this.session.getCurrent();
    if (!page) throw new Error('No page');
    return page;
  }

  async click(selector: string) {
    const page = this.current();
    await page.click(selector);
    this.logAction({ action: 'click', selector });
  }

  async type(selector: string, text: string) {
    const page = this.current();
    await page.type(selector, text);
    this.logAction({ action: 'type', selector, text });
  }

  queryXPath(xpath: string) {
    return this.current().queryXPath(xpath);
  }

  screenshot(path: string) {
    this.current().screenshot(path);
    this.logAction({ action: 'screenshot', path });
  }

  recordVideoStream(duration: number, fps: number, path: string) {
    this.logAction({ action: 'recordVideoStream', duration, fps, path });
    return this.current().recordVideoStream(duration, fps, path);
  }

  waitForSelector(selector: string, timeout?: number) {
    this.logAction({ action: 'waitForSelector', selector, timeout });
    return this.current().waitForSelector(selector, timeout);
  }

  waitForXPath(xpath: string, timeout?: number) {
    this.logAction({ action: 'waitForXPath', xpath, timeout });
    return this.current().waitForXPath(xpath, timeout);
  }

  waitForText(text: string, timeout?: number) {
    this.logAction({ action: 'waitForText', text, timeout });
    return this.current().waitForText(text, timeout);
  }

  getLinks() {
    const links = Array.from(this.current().window.document.querySelectorAll('a'));
    this.logAction({ action: 'getLinks' });
    return links.map(a => ({ text: a.textContent?.trim() || '', href: a.getAttribute('href') || '' }));
  }

  getTable(selector: string) {
    const page = this.current();
    const table = page.getTable(selector);
    this.logAction({ action: 'getTable', selector });
    return table;
  }

  getForms() {
    const forms = this.current().getForms();
    this.logAction({ action: 'getForms' });
    return forms;
  }

  getLists(selector: string) {
    const lists = this.current().getLists(selector);
    this.logAction({ action: 'getLists', selector });
    return lists;
  }

  getText(query: string) {
    const page = this.current();
    let el = page.window.document.querySelector(query);
    if (el) return el.textContent || '';
    const node = page.window.document.evaluate(query, page.window.document, null, 0, null).iterateNext();
    this.logAction({ action: 'getText', query });
    return node?.textContent || '';
  }

  async runFlow(filePath: string) {
    const runner = new DSLRunner(this);
    await runner.runFlow(filePath);
    this.logAction({ action: 'runFlow', filePath });
  }

  async getCookies() {
    const page = this.current();
    const cookies = page.window.document.cookie
      .split(';')
      .map(c => c.trim())
      .filter(Boolean)
      .map(c => {
        const [name, value] = c.split('=');
        return { name, value };
      });
    this.logAction({ action: 'getCookies' });
    return cookies;
  }

  async setCookie(name: string, value: string) {
    const page = this.current();
    page.window.document.cookie = `${name}=${value}`;
    this.logAction({ action: 'setCookie', name, value });
  }

  async clearCookies() {
    const cookies = await this.getCookies();
    const page = this.current();
    cookies.forEach(c => {
      page.window.document.cookie = `${c.name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
    });
    this.logAction({ action: 'clearCookies' });
  }

  async getLocalStorage() {
    const storage = this.current().window.localStorage;
    const result: Record<string, string> = {};
    for (let i = 0; i < storage.length; i++) {
      const key = storage.key(i) as string;
      result[key] = storage.getItem(key) as string;
    }
    this.logAction({ action: 'getLocalStorage' });
    return result;
  }

  async getSessionStorage() {
    const storage = this.current().window.sessionStorage;
    const result: Record<string, string> = {};
    for (let i = 0; i < storage.length; i++) {
      const key = storage.key(i) as string;
      result[key] = storage.getItem(key) as string;
    }
    this.logAction({ action: 'getSessionStorage' });
    return result;
  }

  scrollTo(target: string | { x: number; y: number }) {
    const page = this.current();
    if (typeof target === 'string') {
      const el = page.window.document.querySelector(target);
      (el as HTMLElement)?.scrollIntoView();
    } else {
      page.window.scrollTo(target.x, target.y);
    }
    this.logAction({ action: 'scrollTo', target });
  }

  mouseMove(x: number, y: number) {
    const page = this.current();
    const evt = new page.window.MouseEvent('mousemove', { clientX: x, clientY: y });
    page.window.document.dispatchEvent(evt);
    this.logAction({ action: 'mouseMove', x, y });
  }

  mouseDown(x: number, y: number) {
    const page = this.current();
    const evt = new page.window.MouseEvent('mousedown', { clientX: x, clientY: y });
    page.window.document.dispatchEvent(evt);
    this.logAction({ action: 'mouseDown', x, y });
  }

  mouseUp(x: number, y: number) {
    const page = this.current();
    const evt = new page.window.MouseEvent('mouseup', { clientX: x, clientY: y });
    page.window.document.dispatchEvent(evt);
    this.logAction({ action: 'mouseUp', x, y });
  }

  async drag(from: string, to: string) {
    const page = this.current();
    const src = page.window.document.querySelector(from);
    const dst = page.window.document.querySelector(to);
    if (src && dst) {
      src.dispatchEvent(new page.window.MouseEvent('mousedown'));
      dst.dispatchEvent(new page.window.MouseEvent('mouseup'));
    }
    this.logAction({ action: 'drag', from, to });
  }

  pressKey(key: string) {
    const page = this.current();
    const down = new page.window.KeyboardEvent('keydown', { key });
    const press = new page.window.KeyboardEvent('keypress', { key });
    const up = new page.window.KeyboardEvent('keyup', { key });
    page.window.document.dispatchEvent(down);
    page.window.document.dispatchEvent(press);
    page.window.document.dispatchEvent(up);
    this.logAction({ action: 'pressKey', key });
  }

  uploadFile(selector: string, filePath: string) {
    this.current().uploadFile(selector, filePath);
    this.logAction({ action: 'uploadFile', selector, filePath });
  }

  captureDownloads(dir: string) {
    this.current().captureDownloads(dir);
    this.logAction({ action: 'captureDownloads', dir });
  }

  async compareScreenshots(img1: string | Buffer, img2: string | Buffer) {
    const result = await compareScreenshots(img1, img2);
    this.logAction({ action: 'compareScreenshots' });
    return result;
  }

  startRecording(path: string) {
    this.recorder.startRecording(path);
  }

  stopRecording() {
    this.recorder.stopRecording();
  }

  async replay(path: string) {
    await this.recorder.replay(path, async (entry) => {
      const [action] = Object.keys(entry);
      switch (entry.action) {
        case 'navigate':
          await this.open(entry.url);
          break;
        case 'click':
          await this.click(entry.selector);
          break;
        case 'type':
          await this.type(entry.selector, entry.text);
          break;
        case 'scrollTo':
          await this.scrollTo(entry.target);
          break;
        default:
          break;
      }
    });
  }
}
