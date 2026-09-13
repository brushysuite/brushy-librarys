# Brushy Suite Docs

Mintlify documentation site for `@brushy/di`, `@brushy/storage`, and example projects.

## Prerequisites

- Node.js **22 LTS** (Mintlify CLI may fail on Node 25+)
- Optional global CLI: `npm i -g mint`

## Local preview

From the repository root:

```bash
npm run docs:dev
```

Or from this directory:

```bash
npm run dev
```

The dev server defaults to [http://localhost:3000](http://localhost:3000).

## Validate

```bash
npm run docs:validate
# or
npm run validate
npm run broken-links
```

## Internationalization (i18n)

The site uses Mintlify `navigation.languages`:

- **en** (default): English content at root paths (`index`, `di/overview`, etc.)
- **pt-BR**: Portuguese (Brazil) translations under `pt-BR/`

The language switcher appears automatically in the Mintlify UI. Add or update translated MDX files under `pt-BR/` with the same relative paths as English, then register them in the `pt-BR` navigation block in `docs.json`.

Pages not yet translated in pt-BR still appear in navigation and link to the English version.

## MCP server

The contextual menu is enabled in `docs.json` via the `contextual` block (`copy`, `mcp`, `add-mcp`, `cursor`, `vscode`, `chatgpt`, `claude`). When deployed to Mintlify, the hosted MCP endpoint is available at:

```text
https://<your-site-url>/mcp
```

Users connect from the page header contextual menu. The menu is available on preview and production deployments.

## Structure

```text
apps/docs/
├── docs.json          # Mintlify config (theme, colors, navigation, i18n, MCP)
├── index.mdx          # Home page (English)
├── getting-started/   # Suite introduction (English)
├── di/                # Migrated from packages/di/docs/en
├── storage/           # @brushy/storage guides (English)
├── examples/          # Example projects (English)
├── pt-BR/             # Portuguese (Brazil) translations
│   ├── index.mdx
│   ├── getting-started/
│   ├── di/
│   ├── storage/
│   └── examples/
└── public/            # Logos and favicons
```
