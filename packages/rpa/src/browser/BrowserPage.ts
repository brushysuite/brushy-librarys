import { Window } from 'happy-dom';
import { DomEngine } from '../dom/DomEngine';
import { RenderEngine } from '../dom/RenderEngine';
import { ResourceFetcher } from '../http/ResourceFetcher';
import { waitForSelector, waitForText, waitForXPath } from './WaitUtils';
import { Scraper } from '../scraping/Scraper';
import { FileUtils } from '../utils/FileUtils';

export class BrowserPage {
  public window: Window = new Window();
  private dom?: DomEngine;
  private renderer?: RenderEngine;
  private scraper?: Scraper;
  private fileUtils?: FileUtils;

  constructor(private fetcher: ResourceFetcher) {}

  async open(url: string) {
    const html = await this.fetcher.fetch(url);
    this.dom = new DomEngine(html);
    this.dom.executeScripts();
    this.window = this.dom.window;
    this.renderer = new RenderEngine(this.window);
    this.scraper = new Scraper(this.window);
    this.fileUtils = new FileUtils(this.window);
  }

  async click(selector: string) {
    const el = this.window.document.querySelector(selector);
    el?.dispatchEvent(new this.window.Event('click'));
  }

  async type(selector: string, text: string) {
    const el = this.window.document.querySelector(selector) as any;
    if (el) {
      el.value = text;
      el.dispatchEvent(new this.window.Event('input'));
    }
  }

  queryXPath(xpath: string) {
    const result: Node[] = [];
    const nodes = this.window.document.evaluate(xpath, this.window.document, null, 0, null);
    let node = nodes.iterateNext();
    while (node) {
      result.push(node);
      node = nodes.iterateNext();
    }
    return result;
  }

  screenshot(path: string) {
    this.renderer?.screenshot(path);
  }

  recordVideoStream(duration: number, fps: number, path: string) {
    return this.renderer?.recordVideoStream(duration, fps, path);
  }

  waitForSelector(selector: string, timeout?: number) {
    return waitForSelector(this.window, selector, timeout);
  }

  waitForXPath(xpath: string, timeout?: number) {
    return waitForXPath(this.window, xpath, timeout);
  }

  waitForText(text: string, timeout?: number) {
    return waitForText(this.window, text, timeout);
  }

  getTable(selector: string) {
    return this.scraper?.getTable(selector) ?? [];
  }

  getForms() {
    return this.scraper?.getForms() ?? [];
  }

  getLists(selector: string) {
    return this.scraper?.getLists(selector) ?? [];
  }

  uploadFile(selector: string, filePath: string) {
    this.fileUtils?.uploadFile(selector, filePath);
  }

  captureDownloads(dir: string) {
    this.fileUtils?.captureDownloads(dir);
  }
}
