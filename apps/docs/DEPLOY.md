# Deploy Brushy Suite docs (Mintlify)

Short guide to publish `apps/docs` on Mintlify with a custom domain.

## Prerequisites

- Mintlify account with access to connect GitHub repos
- Repository: `brushysuite/brushy-librarys`
- Docs root: `apps/docs` (contains `docs.json`)

## Connect the repository

1. Open [Mintlify Dashboard](https://dashboard.mintlify.com) → **New deployment** (or add a project).
2. Connect GitHub and select `brushysuite/brushy-librarys`.
3. Set **Docs directory** to `apps/docs`.
4. Deploy branch: `main` (or your release branch).

Mintlify reads `docs.json` for theme, navigation, SEO, contextual MCP, and i18n.

## Custom domain

1. In Mintlify → **Settings** → **Custom domain**, add `brushysuite.gfrancodev.com`.
2. At your DNS provider, add the CNAME or A records Mintlify shows.
3. Wait for TLS provisioning (usually a few minutes).

Canonical URL and Open Graph tags are set in `docs.json` under `seo.metatags.canonical`.

## Post-deploy checks

Verify these URLs resolve:

| URL | Purpose |
| --- | --- |
| `https://brushysuite.gfrancodev.com/` | Home |
| `https://brushysuite.gfrancodev.com/mcp` | Hosted MCP server for AI tools |
| `https://brushysuite.gfrancodev.com/llms.txt` | LLM index (points agents to `/SKILL.md`) |
| `https://brushysuite.gfrancodev.com/SKILL.md` | Imperative agent rules |
| `https://brushysuite.gfrancodev.com/robots.txt` | Crawler policy (allows AI bots) |
| `https://brushysuite.gfrancodev.com/sitemap.xml` | Sitemap |

Test MCP from the docs header: **Connect to Cursor** or **Copy MCP server URL**.

## CI validation

On every push/PR to `main`, CI runs:

```bash
cd apps/docs
npm ci
npm run validate
npm run broken-links
```

Run the same locally before merging doc changes.

## Local preview

```bash
cd apps/docs
npm ci
npm run dev
```

Opens Mintlify dev server (default `http://localhost:3000`).
