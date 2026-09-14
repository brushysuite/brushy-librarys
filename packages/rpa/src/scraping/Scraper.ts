import type { Window } from 'happy-dom';

export class Scraper {
  constructor(private window: Window) {}

  getTable(selector: string) {
    const table = this.window.document.querySelector(selector);
    if (!table) return [] as Record<string, string>[];
    const rows = Array.from(table.querySelectorAll('tr'));
    const headerCells = rows.shift()?.querySelectorAll('th');
    const headers = headerCells ? Array.from(headerCells).map(h => h.textContent?.trim() || '') : [];
    const result: Record<string, string>[] = [];
    for (const row of rows) {
      const cells = Array.from(row.querySelectorAll('td'));
      const obj: Record<string, string> = {};
      cells.forEach((td, i) => {
        const key = headers[i] || String(i);
        obj[key] = td.textContent?.trim() || '';
      });
      result.push(obj);
    }
    return result;
  }

  getForms() {
    const forms = this.window.document.querySelectorAll('form');
    return Array.from(forms).map(form => {
      const fields: Record<string, string> = {};
      form.querySelectorAll('input, textarea, select').forEach(el => {
        const name = (el as HTMLInputElement).name;
        const value = (el as HTMLInputElement).value;
        if (name) fields[name] = value;
      });
      return fields;
    });
  }

  getLists(selector: string) {
    const list = this.window.document.querySelector(selector);
    if (!list) return [] as string[];
    return Array.from(list.querySelectorAll('li')).map(li => li.textContent?.trim() || '');
  }
}
