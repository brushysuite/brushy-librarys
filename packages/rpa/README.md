# @brushy/rpa

High-performance headless RPA engine built with Node.js and TypeScript.

This library provides a lightweight automation engine capable of loading and manipulating webpages without a full browser. It uses a virtual DOM with [happy-dom](https://github.com/capricorn86/happy-dom), executes JavaScript safely with [vm2](https://github.com/patriksimek/vm2) and renders using [node-canvas](https://github.com/Automattic/node-canvas).

> **Note**: This project focuses on performance and minimalism. Not all browser features are supported.

## Features
- Load HTML pages and execute scripts
- Query and manipulate DOM nodes
- Take screenshots and record videos
- Programmatic interactions (click, type, XPath/CSS selectors)
- Cache resources locally for faster loads
- Wait utilities and scraping helpers
- Action recording and replay
- Visual diff of screenshots
- Multi-page sessions with event hooks

## Usage

```ts
import { RPA } from "@brushy/rpa";

(async () => {
  const rpa = new RPA();
  await rpa.open("https://example.com");
  await rpa.click("#login");
  await rpa.type("#username", "admin");
  await rpa.screenshot("page.png");
})();
```

## License

MIT
