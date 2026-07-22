<a href="https://nuxt.com"><img width="1200" alt="Nuxt Website" src="./public/website.jpg"></a>

[![Install in Cursor](https://nuxt.com/mcp/badge.svg)](https://nuxt.com/mcp/deeplink)
[![Install in VSCode](https://nuxt.com/mcp/badge.svg?ide=vscode)](https://nuxt.com/mcp/deeplink?ide=vscode)

# nuxt.com

Welcome to the Nuxt website repository available on [nuxt.com](https://nuxt.com).

[![Nuxt UI](https://img.shields.io/badge/Made%20with-Nuxt%20UI-00DC82?logo=nuxt.js&labelColor=020420)](https://ui.nuxt.com)

## Quickstart

No environment variables are required — the site runs out of the box:

```bash
corepack enable
pnpm install
pnpm dev
```

In this default mode (`--ui-only`):

- The docs are cloned from the public [nuxt/nuxt](https://github.com/nuxt/nuxt) and [nuxt/examples](https://github.com/nuxt/examples) repositories.
- Ecosystem APIs (`/api/v1/**` — modules, templates, etc.) are proxied to nuxt.com.
- The Nuxi agent is visible but disabled: the Eve runtime is not spawned, so no AI keys are needed.

## Development modes

| Command | What it does |
|---------|--------------|
| `pnpm dev` | UI-only mode — zero config, no Eve agent, ecosystem APIs proxied to nuxt.com |
| `pnpm dev:nuxi` | UI-only mode + the Nuxi agent — spawns the Eve runtime (needs `AI_GATEWAY_API_KEY`) |
| `pnpm dev:full` | Full mode — spawns the Eve agent runtime and fetches the Nuxt ecosystem locally |

`pnpm dev:full` requires some environment variables (see [`.env.example`](./.env.example), notably `AI_GATEWAY_API_KEY` for the agent). All variables in `.env.example` are optional and grouped by feature — only set what you need.

### Working on the docs

The docs live in the [nuxt/nuxt](https://github.com/nuxt/nuxt) repository. To edit them locally, clone/fork the repo somewhere outside this project and point the `NUXT_V3_PATH` / `NUXT_V4_PATH` / `NUXT_V5_PATH` variables in your `.env` to your local checkout (use `pwd` — or `echo %cd%` on Windows — inside the clone to get the path). Same goes for `NUXT_EXAMPLES_PATH` with [nuxt/examples](https://github.com/nuxt/examples).

### Signing in locally

Sign-in (dashboard, chat history) needs a GitHub OAuth app: create one at [github.com/settings/applications/new](https://github.com/settings/applications/new) with `http://localhost:3000/api/auth/github` as the callback URL, then set `NUXT_OAUTH_GITHUB_CLIENT_ID` and `NUXT_OAUTH_GITHUB_CLIENT_SECRET` in your `.env`.

### Add a Nuxt Template

To list a Nuxt template, add a file in the [./content/templates](./content/templates) directory.

Make sure to start the development server in order to generate the screenshot for the template and go to http://localhost:3000/templates to see the result.

If you want to update the url where we take the automated screenshot, use the `screenshotUrl` property.

To regenerate the image, delete the generated one in `public/assets/templates`.

## Production

Build the application for production:

```bash
pnpm generate
```

### Running Evals for the MCP Server

To run the evals for the MCP server, follow these steps:

1. **Ensure your development server is running**  
   Start the local Nuxt development server:
   ```bash
   pnpm dev
   ```

2. **Create an AI Gateway API key**  
   Go to https://vercel.com/ai-gateway and create an API key.
   Add the following variable to your `.env` file (replace `sk-...` with your actual key):
   ```
   AI_GATEWAY_API_KEY=<you-api-key>
   ```

3. **Run the evals**  
   You can execute the evals from the command line:
   ```bash
   pnpm eval
   ```

   Or launch the interactive UI to run them via a web interface:
   ```bash
   pnpm eval:ui
   ```

## Nuxi (Eve agent)

Nuxi lives in [`layers/nuxi/`](./layers/nuxi/) — Eve runtime (`agent/`), UI, and internal APIs in one layer. The agent only runs with `pnpm dev:full` (in the default `pnpm dev` ui-only mode, the Eve runtime is not spawned and the chat UI shows a disabled state). For local development:

```bash
# Required — Vercel AI Gateway key for the agent model
AI_GATEWAY_API_KEY=<your-api-key>

# Required — shared secret between the Nuxt app and Eve runtime
INTERNAL_API_SECRET=$(openssl rand -base64 32)

# Optional — canonical site URL for MCP + internal API callbacks
NUXT_PUBLIC_SITE_URL=http://localhost:3000

pnpm dev:nuxi
```

On Vercel, configure **both** the `web` and `eve` services (`vercel.json`) with the same `INTERNAL_API_SECRET`, `AI_GATEWAY_API_KEY`, and database env vars.

## License

[MIT License](./LICENSE)
