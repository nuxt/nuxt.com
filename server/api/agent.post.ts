import { streamText, convertToModelMessages, createUIMessageStream, createUIMessageStreamResponse } from 'ai'
import type { ToolSet } from 'ai'
import { createMCPClient } from '@ai-sdk/mcp'
import { anthropic } from '@ai-sdk/anthropic'
import type { H3Event } from 'h3'
import { createAILogger, createEvlogIntegration } from 'evlog/ai'
import type { AILogger } from 'evlog/ai'
import { sql } from 'drizzle-orm'
import { showModuleTool } from '../utils/tools/show-module'
import { createShowTemplateTool } from '../utils/tools/show-template'
import { createShowBlogPostTool } from '../utils/tools/show-blog-post'
import { createShowHostingTool } from '../utils/tools/show-hosting'
import { openPlaygroundTool } from '../utils/tools/open-playground'
import { createSearchGitHubIssuesTool } from '../utils/tools/search-github-issues'

const MCP_PATH = '/mcp'
const MODEL = 'anthropic/claude-sonnet-4.6'
const MAX_STEPS = 10

function stopWhenResponseComplete({ steps }: { steps: { text?: string, toolCalls?: unknown[] }[] }): boolean {
  const lastStep = steps.at(-1)
  if (!lastStep) return false

  const hasText = Boolean(lastStep.text && lastStep.text.trim().length > 0)
  const hasNoToolCalls = !lastStep.toolCalls || lastStep.toolCalls.length === 0

  if (hasText && hasNoToolCalls) return true

  return steps.length >= MAX_STEPS
}

const systemPrompt = `You are **the Nuxt Agent**, Nuxt's documentation agent on nuxt.com. You help users navigate the official documentation, blog, modules catalog, and guides.

**Identity:** You are the Nuxt Agent — not a generic chatbot. Be confident, precise, and grounded in retrieved content. Avoid casual first person ("I think…"). Attribute capabilities to Nuxt, not to yourself.

**\`[Page: …]\` prefix:** User messages may start with \`[Page: /docs/…]\`. That is which page they had open — a hint, not a command. Only read that page if the question relates to it. Otherwise use the right tools directly.

**Modules:** Never invent npm package names. Use \`show_module\` to display modules (it includes all needed info — do NOT also call \`get-module\` for the same module). NuxtHub's module is \`@nuxthub/core\`, not \`@nuxt/hub\`.

**TOKEN EFFICIENCY (CRITICAL — follow strictly):**
- **ALWAYS pass the \`sections\` parameter** when calling \`get_documentation_page\` or \`get_blog_post\`. Only omit it if the user explicitly needs the entire page. Fetching full pages wastes tokens.
- If you already know the doc path, call \`get_documentation_page\` directly — skip \`list_documentation_pages\`.
- Prefer \`show_module\` over \`get_module\` (smaller response, richer UI).
- Avoid redundant tool calls — one focused call is better than several broad ones.

**Debugging / error questions:**
- When the user shares an error message or stack trace, use \`search_github_issues\` first — it searches across nuxt, nuxt-modules, and nuxt-content orgs.
- If a matching closed issue exists, link to it and summarize the fix/workaround.
- If open, link to the issue and mention any workarounds from the body.
- Only fall back to \`web_search\` if no relevant GitHub Issue is found.

**Tools:**
- \`list_documentation_pages\` — discover pages by topic (use before \`get_documentation_page\` if path unknown)
- \`get_documentation_page\` — read a page. **Always pass \`sections\`** with the relevant h2 titles.
- \`search_github_issues\` — search GitHub Issues across the Nuxt ecosystem. Use for errors, bugs, and debugging questions.
- \`show_module\` — display a module card (preferred for module questions)
- \`show_template\` — display template cards (accepts array of slugs). For vague requests, show official templates first: nuxt-ui-dashboard, nuxt-ui-saas, nuxt-ui-landing, nuxt-ui-chat, nuxt-ui-docs, nuxt-ui-portfolio
- \`show_blog_post\` — display a blog post card
- \`show_hosting\` — display a hosting provider card
- \`open_playground\` — generate a StackBlitz link
- ALWAYS respond with text after tool calls — never end with just tool calls

**Web search:** Only use when the user **explicitly** asks about recent events or real-time data beyond the Nuxt docs, or if \`search_github_issues\` returned no results. Never search proactively.

**Formatting:**
- NEVER use markdown headings (#, ##, ###)
- Use **bold** for emphasis, bullet points for lists
- Use markdown links from tool result URLs
- Be concise and direct — actionable guidance, not information dumps`

function computeEstimatedCost(state: AILogger['_state']): number {
  if (!state.costMap) return 0
  const model = state.models.at(-1)
  if (!model) return 0
  const cost = state.costMap[model]
  if (!cost) return 0
  return (state.usage.inputTokens * cost.input + state.usage.outputTokens * cost.output) / 1_000_000
}

async function getFingerprint(event: H3Event): Promise<string> {
  const ip = event.context.cf?.ip || 'unknown'
  const userAgent = getHeader(event, 'user-agent') || 'unknown'
  const domain = getHeader(event, 'host') || 'localhost'
  const data = `${domain}+${ip}+${userAgent}`
  const buffer = await crypto.subtle.digest('SHA-1', new TextEncoder().encode(data))
  return [...new Uint8Array(buffer)].map(b => b.toString(16).padStart(2, '0')).join('')
}

export default defineEventHandler(async (event) => {
  await consumeAgentRateLimit(event)

  const { messages } = await readBody(event)
  const chatId = getHeader(event, 'x-chat-id')
  const log = useLogger(event)
  const ai = createAILogger(log, {
    toolInputs: true,
    cost: { 'claude-sonnet-4-6': { input: 3, output: 15 } }
  })

  const abortController = new AbortController()
  event.node.req.on('close', () => abortController.abort())

  const mcpUrl = import.meta.dev
    ? `http://localhost:3000${MCP_PATH}`
    : `${getRequestURL(event).origin}${MCP_PATH}`

  const httpClient = await createMCPClient({
    transport: { type: 'http', url: mcpUrl }
  })
  const mcpTools = await httpClient.tools()

  const closeMcp = () => event.waitUntil(httpClient.close())

  const saveChat = async () => {
    if (!chatId) return
    const fingerprint = await getFingerprint(event)
    const now = new Date()
    const state = ai._state
    const model = state.models.at(-1) ?? null
    const provider = state.lastProvider ?? null
    const { inputTokens, outputTokens } = state.usage
    const estimatedCost = computeEstimatedCost(state)
    const durationMs = state.totalDurationMs ?? 0

    await db.insert(schema.agentChats).values({
      id: chatId,
      messages,
      fingerprint,
      model,
      provider,
      inputTokens,
      outputTokens,
      estimatedCost,
      durationMs,
      requestCount: 1,
      createdAt: now,
      updatedAt: now
    }).onConflictDoUpdate({
      target: schema.agentChats.id,
      set: {
        messages,
        updatedAt: now,
        model,
        provider,
        inputTokens: sql`${schema.agentChats.inputTokens} + ${inputTokens}`,
        outputTokens: sql`${schema.agentChats.outputTokens} + ${outputTokens}`,
        estimatedCost: sql`${schema.agentChats.estimatedCost} + ${estimatedCost}`,
        durationMs: sql`${schema.agentChats.durationMs} + ${durationMs}`,
        requestCount: sql`${schema.agentChats.requestCount} + 1`
      }
    })
  }

  const stream = createUIMessageStream({
    execute: async ({ writer }) => {
      const result = streamText({
        model: ai.wrap(MODEL),
        maxOutputTokens: 4000,
        maxRetries: 2,
        abortSignal: abortController.signal,
        stopWhen: stopWhenResponseComplete,
        system: systemPrompt,
        messages: await convertToModelMessages(messages),
        tools: {
          ...mcpTools as ToolSet,
          web_search: anthropic.tools.webSearch_20250305(),
          search_github_issues: createSearchGitHubIssuesTool(event),
          show_module: showModuleTool,
          show_template: createShowTemplateTool(event),
          show_blog_post: createShowBlogPostTool(event),
          show_hosting: createShowHostingTool(event),
          open_playground: openPlaygroundTool
        },
        experimental_telemetry: {
          isEnabled: true,
          integrations: [createEvlogIntegration(ai)]
        },
        onFinish: () => {
          closeMcp()
          event.waitUntil(saveChat())
        },
        onAbort: closeMcp,
        onError: closeMcp
      })

      writer.merge(result.toUIMessageStream({
        sendSources: true
      }))
    }
  })

  return createUIMessageStreamResponse({ stream })
})
