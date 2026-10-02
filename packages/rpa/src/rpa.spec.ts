import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'node:fs';
import { Window } from 'happy-dom';
vi.mock('pixelmatch', () => ({ default: () => 1 }));
vi.mock('canvas', () => ({
  createCanvas: () => ({
    getContext: () => ({
      drawImage: vi.fn(),
      fillRect: vi.fn(),
      fillStyle: '',
      getImageData: () => ({ data: new Uint8ClampedArray(4) }),
      createImageData: () => ({ data: new Uint8ClampedArray(4) }),
      putImageData: vi.fn(),
    }),
    toBuffer: () => Buffer.from([]),
  }),
  loadImage: async () => ({ width: 1, height: 1 }),
}));

vi.mock('./dom/DomEngine', () => {
  return {
    DomEngine: class {
      window: Window;
      constructor(html: string) {
        this.window = new Window();
        this.window.document.write(html);
      }
      executeScripts() {}
    }
  };
});

vi.mock('./dom/RenderEngine', () => {
  return {
    RenderEngine: class {
      constructor() {}
      screenshot() {}
      recordVideoStream() {}
    }
  };
});

vi.mock('./http/ResourceFetcher', () => {
  return {
    ResourceFetcher: class {
      constructor() {}
      fetch(url: string) { return Promise.resolve(html); }
    }
  };
});

import { RPA } from './RPA';

const html = `<!DOCTYPE html><html><body>
<a href="/a">A</a>
<table id="t"><tr><th>Name</th><th>Age</th></tr><tr><td>Alice</td><td>30</td></tr></table>
<div id="text">Hello</div>
</body></html>`;

const logPath = '/tmp/rpa.log.json';

describe('RPA features', () => {
  let rpa: RPA;
  beforeEach(() => {
    rpa = new RPA({ enableLogs: true, logPath });
  });
  afterEach(() => {
    vi.restoreAllMocks();
    if (fs.existsSync(logPath)) fs.unlinkSync(logPath);
  });

  it('wait utilities', async () => {
    await rpa.open('http://test');
    await rpa.waitForSelector('#text');
    await expect(rpa.waitForSelector('#missing', 100)).rejects.toThrow();
  });

  it('scraping helpers', async () => {
    await rpa.open('http://test');
    expect(rpa.getLinks()).toEqual([{ text: 'A', href: '/a' }]);
    expect(rpa.getTable('#t')).toEqual([{ Name: 'Alice', Age: '30' }]);
    expect(rpa.getText('#text')).toBe('Hello');
  });

  it('cookies and storage', async () => {
    await rpa.open('http://test');
    await rpa.setCookie('session', '123');
    expect(await rpa.getCookies()).toEqual([{ name: 'session', value: '123' }]);
    await rpa.clearCookies();
    expect(await rpa.getCookies()).toEqual([]);
    const page = (rpa as any).session.getCurrent();
    page!.window.localStorage.setItem('foo', 'bar');
    expect(await rpa.getLocalStorage()).toEqual({ foo: 'bar' });
  });

  it('runFlow executes yaml', async () => {
    const path = '/tmp/flow.yaml';
    fs.writeFileSync(path, '- navigate: http://site\n- click: "#btn"');
    const openSpy = vi.spyOn(rpa, 'open').mockResolvedValue(undefined as any);
    const clickSpy = vi.spyOn(rpa, 'click').mockResolvedValue(undefined as any);
    await rpa.runFlow(path);
    expect(openSpy).toHaveBeenCalledWith('http://site');
    expect(clickSpy).toHaveBeenCalledWith('#btn');
    fs.unlinkSync(path);
  });

  it('logs actions', async () => {
    await rpa.open('http://test');
    await rpa.click('a');
    const content = fs.readFileSync(logPath, 'utf8').trim().split('\n');
    const logs = content.map((l) => JSON.parse(l));
    expect(logs[0].action).toBe('navigate');
    expect(logs[1].action).toBe('click');
  });

  it('records and replays actions', async () => {
    const recPath = '/tmp/flow.yaml';
    rpa.startRecording(recPath);
    await rpa.open('http://test');
    await rpa.click('a');
    rpa.stopRecording();
    const openSpy = vi.spyOn(rpa, 'open');
    await rpa.replay(recPath);
    expect(openSpy).toHaveBeenCalled();
    fs.unlinkSync(recPath);
  });

  it('emits events', async () => {
    const fn = vi.fn();
    rpa.on('click', fn);
    await rpa.open('http://test');
    await rpa.click('a');
    expect(fn).toHaveBeenCalled();
  });

  it('compares screenshots', async () => {
    const { createCanvas } = await import('canvas');
    const canvas = createCanvas(10, 10);
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, 10, 10);
    const buf1 = canvas.toBuffer('image/png');
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, 5, 5);
    const buf2 = canvas.toBuffer('image/png');
    const diff = await rpa.compareScreenshots(buf1, buf2);
    expect(diff.percentageChanged).toBeGreaterThan(0);
  });
});
