---
title: Built for the agentic era
highlight: agentic era
head:
  title: Nuxt for AI Agents
  description: Coding agents build Nuxt apps with fewer tokens and clear errors to fix, and the apps they ship work for the agents your users bring.
description: Coding agents build Nuxt apps with fewer tokens and clear errors to fix, and the apps they ship work for the agents your users bring.
navigation:
  icon: i-lucide-sparkles
links:
  - label: Connect your agent
    to: '#connect-your-agent'
    trailingIcon: i-lucide-arrow-down
    size: xl
  - label: Read the benchmark
    to: 'https://nolanlawson.com/2026/10/28/the-ai-cost-of-javascript-frameworks/'
    target: _blank
    trailingIcon: i-lucide-arrow-up-right
    color: neutral
    variant: subtle
    size: xl
halves:
  - id: development
    num: 1
    when: Before you ship
    title: Development
    description: How Nuxt works for the coding agent that builds your app.
    icon: i-lucide-square-terminal
    sections:
      - id: conventions
        label: Conventions mean fewer tokens
      - id: feedback-loop
        label: A fast feedback loop
      - id: errors
        label: Errors an agent can fix
      - id: connect-your-agent
        label: Connect your agent
  - id: production
    num: 2
    when: After you ship
    title: Production
    description: How Nuxt works for the agents that use the app you ship.
    icon: i-lucide-app-window
    sections:
      - id: webmcp
        label: WebMCP built in
      - id: mcp-server
        label: Your own MCP server
      - id: markdown
        label: Markdown for every page
      - id: performance
        label: Fast for people too
---

::agents-half-header{half="development"}
#title
Development

#description
How Nuxt works for the coding agent that builds your app.
::

::agents-section{id="conventions" label="01 · Conventions" wide space="lg"}
#title
Conventions mean fewer tokens

#description
File-based routing, auto-imports and a fixed directory structure leave the agent less to decide and less to write.

#default
:agents-file-tree

#below
:::agents-stat-band{value="3.85M" label="Tokens" detail="Fewest of 12" icon="i-lucide-type" place="1" of="12"}
  ::::agents-token-range{low="3.16M" median="3.85M" high="8.18M" position="13.7"}
  ::::

  ::::div{class="grid grid-cols-2 gap-4"}
    :::::agents-stat{value="$2.82" label="Cost" detail="3rd of 12" icon="i-lucide-receipt" place="3" of="12"}
    :::::

    :::::agents-stat{value="1,415" label="Lines of code" detail="2nd of 12" icon="i-lucide-code" place="2" of="12"}
    :::::
  ::::
:::

:::agents-caveat
#title
About these numbers

#default
[Nolan Lawson](https://nolanlawson.com/2026/10/28/the-ai-cost-of-javascript-frameworks/){target="_blank"} gave Claude Code with Opus 5.5 one spec (a Pokémon browser on the PokéAPI) and had it build the app five times in each of 12 frameworks, checked against a conformance suite.

Medians of five runs with Nuxt 4.6.2, cost at API list prices. The Nuxt MCP server was installed but never called, so the result comes from the framework. It's one small, content-heavy app, and Nuxt's tokens ranged from 3.16M to 8.18M.

:u-button{to="https://nolanlawson.com/2026/10/28/the-ai-cost-of-javascript-frameworks/" target="_blank" label="Source: Nolan Lawson's benchmark" variant="link" trailing-icon="i-lucide-arrow-up-right" class="self-start px-0 text-[15px]"}
:::

:::agents-aside{id="evals" label="Evals"}
#title
Measured on Nuxt tasks

#description
We run coding agents against Nuxt, Nuxt UI and Nuxt Content tasks and publish each model's success rate, time and cost.

#default
:agents-eval-suites

:u-button{to="/evals" label="See the evals" color="neutral" variant="subtle" size="xl" trailing-icon="i-lucide-arrow-right" class="w-full justify-center min-h-12 bg-elevated ring-accented hover:bg-accented/70"}
:::
::

::agents-section{id="feedback-loop" label="02 · Feedback loop" layout="stack"}
#title
A fast feedback loop

#description
An agent works in a loop: change a file, read what the dev server reports, try again.

#default
:::div{class="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] items-center gap-12 lg:gap-x-[clamp(32px,5vw,80px)]"}
  ::::agents-loop-ring{value="9.0 min" label="Time to build the app" detail="Median, 3rd of 12"}
  Same benchmark as above. [Source: Nolan Lawson ↗](https://nolanlawson.com/2026/10/28/the-ai-cost-of-javascript-frameworks/){target="_blank"}
  ::::

  ::::div{class="min-w-0 flex flex-col gap-4 [&>p]:my-0"}
  Since Nuxt 4.7, the dev overlay collects type errors, Vite checkers such as ESLint, Vue compiler warnings and Nuxt's own warnings in one problems list.

  :agents-problems-panel
  ::::
:::
::

::agents-section{id="errors" label="03 · Errors" layout="stack"}
#title
Errors an agent can fix

#description
Three changes, each tied to a release.

#default
:::u-page-grid{class="sm:grid-cols-1 lg:grid-cols-3 gap-4"}
  ::::agents-release{version="Nuxt 4.5"}
    :::::agents-card{to="/docs/errors/e1001" link="See NUXT_E1001" bleed}
    #header
    :agents-error-code-visual

    #title
    Stable error codes

    #description
    Codes like `NUXT_E1001`, with why it happened and a fix.
    :::::
  ::::

  ::::agents-release{version="Nuxt 4.6"}
    :::::agents-card{bleed}
    #header
    :agents-code-frame-visual

    #title
    Source-mapped server errors

    #description
    A code frame, printed in the terminal the agent reads and copyable as an agent prompt.
    :::::
  ::::

  ::::agents-release{version="Nuxt 4.7" current}
    :::::agents-card{bleed}
    #header
    :agents-config-check-visual

    #title
    Validated runtime config

    #description
    Use a Zod, Valibot or ArkType schema. A bad value stops the server with one error that lists everything wrong.
    :::::
  ::::
:::
::

::agents-section{id="connect-your-agent" label="04 · Setup" layout="stack"}
#title
Connect your agent

#description
The MCP server has 13 tools for docs, modules, deploy guides and release notes.

#default
:::agents-connect
:agents-mcp-link

::::div{class="flex flex-col gap-2"}
:::::div{class="text-[13px] font-medium text-muted"}
MCP server URL
:::::

:u-input-copy{value="https://nuxt.com/mcp" label="https://nuxt.com/mcp" size="xl"}
::::

::::tabs
  :::::tabs-item{label="Claude Code"}
    ::::::agents-typed-command
    ```bash [Terminal]
    claude mcp add --transport http nuxt https://nuxt.com/mcp
    ```
    ::::::
  :::::

  :::::tabs-item{label="Cursor"}
    ::::::u-button
    ---
    to: "cursor://anysphere.cursor-deeplink/mcp/install?name=nuxt&config=eyJ0eXBlIjoiaHR0cCIsInVybCI6Imh0dHBzOi8vbnV4dC5jb20vbWNwIn0%3D"
    label: Install in Cursor
    color: neutral
    icon: i-custom-cursor
    size: lg
    ---
    ::::::

    Or add it to your project yourself:

    ```json [.cursor/mcp.json] line-numbers
    {
      "mcpServers": {
        "nuxt": {
          "type": "http",
          "url": "https://nuxt.com/mcp"
        }
      }
    }
    ```
  :::::

  :::::tabs-item{label="VS Code"}
    ```json [.vscode/mcp.json] line-numbers
    {
      "servers": {
        "nuxt": {
          "type": "http",
          "url": "https://nuxt.com/mcp"
        }
      }
    }
    ```
  :::::
::::

#aside
:agents-mcp-tools

::::div{class="flex flex-col gap-3 px-1"}
  :::::agents-tip{icon="i-lucide-book-open"}
  Another client? [See the MCP docs](/docs/guide/ai/mcp) for setup in other agents and editors.
  :::::

  :::::agents-tip{icon="i-lucide-info"}
  Tip: send an `X-MCP-Tools` header that names only the tools you need.
  :::::

  :::::agents-tip{icon="i-lucide-plug"}
  Nuxt UI has its own server at `https://ui.nuxt.com/mcp`.
  :::::
::::

#below
::::agents-card
#title
Nuxt UI skill

#description
Add the Nuxt UI skill to your agent.

```bash
npx skills add nuxt/ui
```
::::

::::agents-card
#title
Markdown docs

#description
Add `.md` to a docs URL or send `Accept: text/markdown`.

:::::agents-link-list
- [`/llms.txt`](/llms.txt){external}
- [`/llms-full.txt`](/llms-full.txt){external}
- [`/sitemap.md`](/sitemap.md){external}
:::::
::::
:::
::

::agents-half-header{half="production"}
#title
Production

#description
How Nuxt works for the agents that use the app you ship.
::

::agents-section{id="webmcp" label="01 · WebMCP" badge="Experimental" layout="stack" space="lg"}
#title
WebMCP built in

#description
A proposed browser API that lets a page offer tools to agents in the browser.

#default
:::div{class="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.36fr)] items-start gap-10 lg:gap-x-[clamp(32px,5vw,80px)]"}
  ::::div{class="min-w-0 flex flex-col gap-4 [&>p]:my-0 [&>p]:text-[clamp(16px,1.3vw,18px)]/[1.7]"}
  Since Nuxt 4.7, tag a function with `@tool` and an agent can call it wherever a user could click it. For other tools, use `defineAgentTool()`.

  :u-button{to="/docs/guide/ai/webmcp" label="WebMCP docs" variant="link" trailing-icon="i-lucide-arrow-right" class="self-start px-0 min-h-11 text-[15px]"}

  :agents-web-mcp-demo
  ::::

  ::::div{class="min-w-0"}
:::::code-group{defaultValue="1"}
```ts [nuxt.config.ts] {3} line-numbers diff
export default defineNuxtConfig({
  experimental: {
    webmcp: true,
  },
})
```

```vue [app/pages/index.vue] {7} line-numbers
<script setup lang="ts">
const { data: products } = await useFetch('/api/products')
const cart = useCart()

/**
 * Add one of a product to the cart. Use when the user wants to buy something.
 * @tool
 */
function addToCart(sku: string) {
  cart.value.push(sku)
}
</script>

<template>
  <button v-for="p in products" :key="p.sku" :disabled="!p.inStock" @click="addToCart(p.sku)">
    Add {{ p.name }}
  </button>
</template>
```

```vue [app/pages/products.vue] line-numbers
<script setup lang="ts">
import { z } from 'zod'

const searchProducts = defineAgentTool({
  name: 'search_products',
  description: 'Find products by name. Use when the user asks what is for sale.',
  input: z.object({ query: z.string() }),
  annotations: { readOnlyHint: true },
  execute: ({ query }, { signal }) => $fetch('/api/products', { query: { q: query }, signal }),
})

useAgentTool(searchProducts)
</script>
```
:::::
  ::::
:::
::

::agents-section{id="mcp-server" label="02 · MCP server" layout="stack"}
#title
Your own MCP server

#description
`@nuxtjs/mcp-toolkit` turns files in `server/mcp/` into an MCP server.

#default
:::div{class="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.36fr)] items-start gap-10 lg:gap-x-[clamp(32px,5vw,80px)]"}
  ::::div{class="min-w-0 flex flex-col gap-4 [&>p]:my-0 [&>p]:text-[clamp(16px,1.3vw,18px)]/[1.7]"}
  The 13 tools at nuxt.com/mcp are built with it.

  :u-button{to="/modules/mcp" label="See the module" variant="link" trailing-icon="i-lucide-arrow-right" class="self-start px-0 min-h-11 text-[15px]"}

  :agents-mcp-tree
  ::::

  ::::div{class="min-w-0"}
```ts [server/mcp/tools/get-changelog.ts] line-numbers
import { z } from 'zod'

export default defineMcpTool({
  description: 'Retrieves the latest releases from Nuxt core and official modules.',
  inputSchema: {
    repo: z.string().optional().describe('Filter by repository, like "nuxt/ui"'),
  },
  async handler({ repo }) {
    return $fetch('/api/releases', { query: { repo } })
  },
})
```
  ::::
:::
::

::agents-section{id="markdown" label="03 · Markdown" layout="stack"}
#title
Markdown for every page

#description
`nuxt-agent-discovery` serves each page as Markdown to agents that ask, plus discovery documents, `sitemap.md` and a `robots.txt` AI policy.

#default
:::div{class="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.36fr)] items-start gap-10 lg:gap-x-[clamp(32px,5vw,80px)]"}
  ::::div{class="min-w-0 flex flex-col gap-4 [&>p]:my-0 [&>p]:text-[clamp(16px,1.3vw,18px)]/[1.7]"}
  nuxt.com runs on it.

  :u-button{to="/modules/agent-discovery" label="See the module" variant="link" trailing-icon="i-lucide-arrow-right" class="self-start px-0 min-h-11 text-[15px]"}
  ::::

  ::::div{class="min-w-0"}
```bash [Terminal]
curl -H 'Accept: text/markdown' \
  https://nuxt.com/docs/4.x/getting-started/data-fetching
```
  ::::
:::

#below
:::div{class="flex flex-col gap-[clamp(28px,3vw,40px)] pt-[clamp(28px,3vw,40px)] border-t border-default"}
  ::::agents-size-bar{value="824 KB" label="Data fetching page as HTML" bar="100"}
  ::::

  ::::agents-size-bar{value="34 KB" label="The same page as Markdown" detail="24 times smaller" bar="4.13" highlight}
  ::::

  ::::div{class="text-sm/normal text-muted"}
  Uncompressed response sizes for nuxt.com/docs/4.x/getting-started/data-fetching, measured November 2026.
  ::::
:::
::

::agents-section{id="performance" label="04 · Performance" layout="stack"}
#title
Fast for people too

#description
[e18e framework benchmark](https://frameworks.e18e.dev/run-time/){target="_blank"}, server-rendered results for Nuxt 4.7.

#default
:::div{class="grid sm:grid-cols-3 border-y border-default max-sm:divide-y sm:divide-x divide-default"}
  ::::agents-stat{value="76" unit="ms" label="First paint" detail="3rd of 10" place="3" of="10" size="lg" class="py-[clamp(24px,3vw,40px)] sm:pe-[clamp(16px,2.4vw,32px)]"}
  ::::

  ::::agents-stat{value="10.9" unit="ms" label="Interaction latency" detail="2nd of 10" place="2" of="10" size="lg" class="py-[clamp(24px,3vw,40px)] sm:px-[clamp(16px,2.4vw,32px)]"}
  ::::

  ::::agents-stat{value="2.82" unit="ms" label="Interaction work to commit" detail="2nd of 10" place="2" of="10" size="lg" class="py-[clamp(24px,3vw,40px)] sm:ps-[clamp(16px,2.4vw,32px)]"}
  ::::
:::

:::div{class="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 text-sm/normal text-muted [&>p]:my-0"}
Source: e18e framework benchmark, server-rendered, Nuxt 4.7.

:u-button{to="https://frameworks.e18e.dev/run-time/" target="_blank" label="See the full results" variant="link" trailing-icon="i-lucide-arrow-up-right" class="px-0 min-h-11 text-[15px]"}
:::
::

::agents-section{id="build-ai" layout="stack" divider}
#title
Build AI features with Nuxt

#default
:::u-page-grid{class="lg:grid-cols-3 gap-4"}
  ::::agents-card{to="/templates/nuxt-ui-chat" link="See the template" icon="i-lucide-layout-template"}
  #header
  :agents-chat-preview{variant="template"}

  #title
  AI Chatbot template

  #description
  A chat app with auth and history, built with the AI SDK and Nuxt UI.
  ::::

  ::::agents-card{to="https://ui.nuxt.com/docs/components/chat-messages" target="_blank" link="See the components" icon="i-lucide-messages-square"}
  #header
  :agents-chat-preview{variant="components"}

  #title
  Nuxt UI chat components

  #description
  Messages, prompts, reasoning and tool calls.
  ::::

  ::::agents-nuxi-card
  #title
  Nuxi

  #description
  The assistant on nuxt.com, built with Nuxt and the Nuxt UI chat components.
  ::::
:::
::
