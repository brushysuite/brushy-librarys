# Deploy Brushy Suite docs (Mintlify)

Short guide to publish `apps/docs` on Mintlify with a custom domain.

## Prerequisites

- Mintlify account with access to connect GitHub repos
- Repository: `brushysuite/brushy-librarys`
- Docs root: `apps/docs` (contains `docs.json`)

## Connect the repository

1. Open [Mintlify Dashboard](https://dashboard.mintlify.com) → **New deployment** (or add a project).
2. Connect GitHub and select `brushysuite/brushy-librarys`.
3. Enable **Set up as monorepo** (or **docs.json is in a subdirectory**).
4. Set the documentation path to `/apps/docs` (no trailing slash).
5. Deploy branch: `main` (or your release branch).
6. Click **Save changes**. Saving triggers a new deployment.

Mintlify reads `docs.json` for theme, navigation, SEO, contextual MCP, and i18n.

> **Monorepo requirement:** This repo is a monorepo. `docs.json` lives in `apps/docs/`, not at the repository root. If the Mintlify GitHub App is not configured with the subdirectory path, deployments fail with `Unable to find docs.json`.

## Troubleshooting: `Unable to find docs.json`

**Cause:** The Mintlify GitHub App scans the repository root by default. In this monorepo, the content directory is `apps/docs/`.

**Fix (dashboard — required):**

1. Open [Git settings](https://app.mintlify.com/settings/deployment/git-settings) in the Mintlify dashboard.
2. Select the deployment connected to `brushysuite/brushy-librarys`.
3. Enable **Set up as monorepo** / **docs.json is in a subdirectory**.
4. Enter `/apps/docs` as the documentation path (leading slash OK; no trailing slash).
5. Confirm deploy branch is `main`.
6. Click **Save changes** and wait for the new deployment on the [Activity](https://app.mintlify.com/activity) page.

**Repo-side workarounds (not supported):**

| Approach | Result |
| --- | --- |
| Symlink `docs.json` at repo root | App may find config, but MDX/assets under `apps/docs/` are not resolved |
| Symlink all doc files to root | `mintlify validate` still fails (~90 missing-page warnings) |
| Root `docs.json` with `$ref` to `apps/docs/docs.json` | Same failure — page paths resolve from repo root, not `apps/docs/` |
| `mintlify.json` redirect | Does not exist in Mintlify |

There is no repo-only config file for the subdirectory path. The [monorepo setup](https://www.mintlify.com/docs/deploy/monorepo) must be configured in the Mintlify dashboard.

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
pnpm install --ignore-workspace --frozen-lockfile
pnpm run validate
pnpm run broken-links
```

Run the same locally before merging doc changes.

## Local preview

```bash
cd apps/docs
pnpm install --ignore-workspace --frozen-lockfile
pnpm run dev
```

Opens Mintlify dev server (default `http://localhost:3000`).

---

## Deploy (pt-BR)

Guia para publicar a documentação do monorepo `brushysuite/brushy-librarys` na Mintlify.

### Estrutura do repositório

```
brushy-librarys/          ← raiz do repositório (onde o GitHub App olha por padrão)
├── apps/
│   └── docs/             ← diretório de conteúdo Mintlify
│       ├── docs.json     ← configuração do site
│       ├── index.mdx
│       ├── di/
│       ├── storage/
│       └── ...
├── packages/
└── ...
```

O `docs.json` **não** está na raiz. Sem configurar o caminho do monorepo, o deploy falha com:

```
Unable to find docs.json
```

### Corrigir o deploy (passo a passo no dashboard)

1. Acesse o [Mintlify Dashboard](https://dashboard.mintlify.com) e faça login.
2. Selecione o deployment do projeto **Brushy Suite** (ou o nome que você definiu).
3. No menu lateral, abra **Settings** → **Git settings**  
   (atalho direto: [app.mintlify.com/settings/deployment/git-settings](https://app.mintlify.com/settings/deployment/git-settings)).
4. Na seção do repositório `brushysuite/brushy-librarys`:
   - Confirme que o repositório e a branch `main` estão corretos.
   - Ative o toggle **Set up as monorepo** (ou **docs.json is in a subdirectory**).
   - No campo de caminho, digite: `/apps/docs`  
     (com barra inicial; **sem** barra no final).
5. Clique em **Save changes**.
6. A Mintlify dispara um novo deploy automaticamente. Acompanhe em **Activity** → aba de produção/previews.
7. Quando o status ficar verde, confira `https://brushysuite.gfrancodev.com/`.

### Primeira conexão (se ainda não conectou)

1. Dashboard → **New deployment** (ou adicionar projeto).
2. Conecte o GitHub e autorize o **Mintlify GitHub App** no org `brushysuite`.
3. Selecione o repositório `brushysuite/brushy-librarys`.
4. **Antes de salvar**, ative **Set up as monorepo** e informe `/apps/docs`.
5. Branch de deploy: `main`.
6. Salve e aguarde o primeiro deploy.

### Por que não dá para resolver só no repositório?

Testamos alternativas no repositório; nenhuma substitui a configuração do dashboard:

- **Symlink** `docs.json` na raiz → o app pode encontrar o JSON, mas as páginas MDX e assets em `apps/docs/` não são resolvidos.
- **Symlinks** de todos os arquivos de docs na raiz → `mintlify validate` continua falhando.
- **`$ref`** no `docs.json` da raiz apontando para `apps/docs/docs.json` → mesmo problema de caminhos.
- **`mintlify.json`** → não existe na plataforma Mintlify.

A documentação oficial de [monorepo](https://www.mintlify.com/docs/deploy/monorepo) exige a configuração do caminho no dashboard.

### Validação local antes do merge

```bash
cd apps/docs
pnpm install --ignore-workspace --frozen-lockfile
pnpm run validate
pnpm run broken-links
```

Use Node.js 22 LTS (o CLI da Mintlify não suporta Node 25+).
