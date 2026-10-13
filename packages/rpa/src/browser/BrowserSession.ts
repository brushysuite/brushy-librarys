import { BrowserPage } from './BrowserPage';

export class BrowserSession {
  private pages: BrowserPage[] = [];
  private current?: BrowserPage;

  add(page: BrowserPage) {
    this.pages.push(page);
    this.current = page;
  }

  getCurrent(): BrowserPage | undefined {
    return this.current;
  }

  getPages() {
    return this.pages;
  }

  setCurrent(page: BrowserPage) {
    this.current = page;
  }
}
