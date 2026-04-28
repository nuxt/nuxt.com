import { streamText, convertToModelMessages, createUIMessageStream, createUIMessageStreamResponse, safeValidateUIMessages } from 'ai'
import type { ToolSet, UIMessage } from 'ai'
import { createMCPClient } from '@ai-sdk/mcp'
import { anthropic } from '@ai-sdk/anthropic'
import { createAILogger, createEvlogIntegration } from 'evlog/ai'
import type { AILogger } from 'evlog/ai'
import { sql } from 'drizzle-orm'
import { getAgentFingerprint } from '../utils/agent-fingerprint'
import { showModuleTool } from '../utils/tools/show-module'
import { createShowTemplateTool } from '../utils/tools/show-template'
import { createShowBlogPostTool } from '../utils/tools/show-blog-post'
import { createShowHostingTool } from '../utils/tools/show-hosting'
import { openPlaygroundTool } from '../utils/tools/open-playground'
import { createSearchGitHubIssuesTool } from '../utils/tools/search-github-issues'
import { reportIssueTool } from '../utils/tools/report-issue'

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

const baseSystemPrompt = `You are **the Nuxt Agent**, Nuxt's documentation agent on nuxt.com. You help users navigate the official documentation, blog, modules catalog, and guides.

**Identity:** You are the Nuxt Agent — not a generic chatbot. Be confident, precise, and grounded in retrieved content. Avoid casual first person ("I think…"). Attribute capabilities to Nuxt, not to yourself.

**Current page context:** When the request includes a "Current page" line at the top of this prompt, that's the page the user has open in the browser. Treat it as a strong hint about what they're asking about, especially for vague questions like "explain this", "summarize", "tldr", "what does this do?". Map the path to the right tool:
- \`/docs/…\` → \`get-documentation-page\` with that exact path
- \`/blog/…\` → \`get-blog-post\` with that exact path
- \`/deploy/…\` → \`get-deploy-provider\` with that exact path
- \`/modules/<slug>\` → \`show_module\` with that slug
- \`/changelog/…\` → use the GitHub changelog tools
Do NOT call \`list-*\` first when the page is given — call the get tool directly. If the question is unrelated to the current page, ignore it and answer normally.

**Modules:** Never invent npm package names. Use \`show_module\` to display modules (it includes all needed info — do NOT also call \`get-module\` for the same module). NuxtHub's module is \`@nuxthub/core\`, not \`@nuxt/hub\`.

**TOKEN EFFICIENCY (CRITICAL — follow strictly):**
- For \`get-documentation-page\`: pass the \`sections\` parameter with the relevant h2 titles when you only need part of a long page. Omit it when the user wants an overview/tldr/summary of the whole page.
- For \`get-blog-post\` and \`get-deploy-provider\`: do NOT use sections — these pages are short, fetch them once in full.
- **Never call the same tool twice with the same path** in a single turn. If the first call returned content, work with it — do not refetch.
- If you already know the doc path, call \`get-documentation-page\` directly — skip \`list-documentation-pages\`.
- Prefer \`show_module\` over \`get-module\` (smaller response, richer UI).

**Debugging / error questions:**
- When the user shares an error message or stack trace, use \`search_github_issues\` first — it searches across nuxt, nuxt-modules, and nuxt-content orgs.
- If a matching closed issue exists, link to it and summarize the fix/workaround.
- If open, link to the issue and mention any workarounds from the body.
- Only fall back to \`web_search\` if no relevant GitHub Issue is found.

**Tools:**
- \`list-documentation-pages\` — discover pages by topic (use before \`get-documentation-page\` if path unknown)
- \`get-documentation-page\` — read a doc page. Pass \`sections\` with the relevant h2 titles for partial reads; omit for full-page overviews.
- \`get-blog-post\` — read a blog post (full content, no sections).
- \`get-deploy-provider\` — read a deploy provider page (full content, no sections).
- \`search_github_issues\` — search GitHub Issues across the Nuxt ecosystem. Use for errors, bugs, and debugging questions.
- \`show_module\` — display a module card (preferred for module questions)
- \`show_template\` — display template cards (accepts array of slugs). For vague requests, show official templates first: nuxt-ui-dashboard, nuxt-ui-saas, nuxt-ui-landing, nuxt-ui-chat, nuxt-ui-docs, nuxt-ui-portfolio
- \`show_blog_post\` — display a blog post card
- \`show_hosting\` — display a hosting provider card
- \`open_playground\` — generate a StackBlitz link
- \`report_issue\` — call when you cannot resolve the user's question after exhausting all available tools, or when the user expresses frustration. Provide a short title and 1-3 sentence summary of what was tried and why it failed
- ALWAYS respond with text after tool calls — never end with just tool calls

**Web search:** Only use when the user **explicitly** asks about recent events or real-time data beyond the Nuxt docs, or if \`search_github_issues\` returned no results. Never search proactively.

**Web search queries:** Match the user's wording. **Do not** tack on calendar years (e.g. "2024", "2025") unless they asked for a specific year or time range — that often **hurts** relevance and looks wrong when the current year has moved on. The search already returns current pages. For stable facts (team pages, about pages), use neutral queries without a year.

**Formatting:**
- NEVER use markdown headings (#, ##, ###)
- Use **bold** for emphasis, bullet points for lists
- Prefer **root-relative** markdown links for nuxt.com pages (\`/docs/...\`, \`/blog/...\`, \`/modules/...\`) so navigation works on localhost and preview deployments. Full \`https://nuxt.com/...\` URLs from tool results are acceptable if shorter to reuse as-is. Use full URLs for external sites (GitHub, Stack Overflow, etc.).
- Be concise and direct — actionable guidance, not information dumps`

const PAGE_PATH_PATTERN = /^\/[\w./-]*$/

function buildSystemPrompt(pagePath: string | null): string {
  const today = new Date()
  const dateLine = `**Today's date:** ${today.toLocaleDateString('en-US', { timeZone: 'UTC' })} (UTC). Use it for recency — do not assume an older year when formulating web searches or answers.`
  const withDate = `${dateLine}\n\n${baseSystemPrompt}`
  if (!pagePath) return withDate
  return `Current page: ${pagePath}\n\n${withDate}`
}

function computeEstimatedCost(state: AILogger['_state']): number {
  if (!state.costMap) return 0
  const model = state.models.at(-1)
  if (!model) return 0
  const cost = state.costMap[model]
  if (!cost) return 0
  return (state.usage.inputTokens * cost.input + state.usage.outputTokens * cost.output) / 1_000_000
}

export default defineEventHandler(async (event) => {
  const raw = await readBody(event) as { messages?: unknown } | null
  if (!raw || !Array.isArray(raw.messages)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid request body' })
  }

  const validated = await safeValidateUIMessages({ messages: raw.messages })
  if (validated.success === false) {
    throw createError({
      statusCode: 400,
      statusMessage: validated.error.message || 'Invalid messages'
    })
  }

  const messages = validated.data

  await consumeAgentRateLimit(event)
  const chatId = getHeader(event, 'x-chat-id')
  const rawPagePath = getHeader(event, 'x-page-path')?.trim() ?? null
  const pagePath = rawPagePath && PAGE_PATH_PATTERN.test(rawPagePath) && rawPagePath.length <= 256
    ? rawPagePath
    : null
  const log = useLogger(event)
  const ai = createAILogger(log, {
    toolInputs: true,
    cost: { 'claude-sonnet-4-6': { input: 3, output: 15 } }
  })

  const abortController = new AbortController()
  event.node.req.on('close', () => abortController.abort())

  const httpClient = await createMCPClient({
    transport: { type: 'http', url: `${getRequestURL(event).origin}${MCP_PATH}` }
  })
  const mcpTools = await httpClient.tools()

  const closeMcp = () => event.waitUntil(httpClient.close())

  const saveChat = async (finalizedMessages: UIMessage[]) => {
    if (!chatId) return
    const fingerprint = await getAgentFingerprint(event)
    const now = new Date()
    const state = ai._state
    const model = state.models.at(-1) ?? null
    const provider = state.lastProvider ?? null
    const { inputTokens, outputTokens } = state.usage
    const estimatedCost = computeEstimatedCost(state)
    const durationMs = state.totalDurationMs ?? 0

    // Insert when chatId is new; on conflict only update when the existing row's
    // fingerprint matches — prevents anyone with a guessable chatId from
    // overwriting another user's conversation.
    await db.insert(schema.agentChats).values({
      id: chatId,
      messages: finalizedMessages,
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
        messages: finalizedMessages,
        updatedAt: now,
        model,
        provider,
        inputTokens: sql`${schema.agentChats.inputTokens} + ${inputTokens}`,
        outputTokens: sql`${schema.agentChats.outputTokens} + ${outputTokens}`,
        estimatedCost: sql`${schema.agentChats.estimatedCost} + ${estimatedCost}`,
        durationMs: sql`${schema.agentChats.durationMs} + ${durationMs}`,
        requestCount: sql`${schema.agentChats.requestCount} + 1`
      },
      where: sql`${schema.agentChats.fingerprint} = ${fingerprint}`
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
        system: buildSystemPrompt(pagePath),
        messages: await convertToModelMessages(messages),
        tools: {
          ...mcpTools as ToolSet,
          web_search: anthropic.tools.webSearch_20250305(),
          search_github_issues: createSearchGitHubIssuesTool(event),
          show_module: showModuleTool,
          show_template: createShowTemplateTool(event),
          show_blog_post: createShowBlogPostTool(event),
          show_hosting: createShowHostingTool(event),
          open_playground: openPlaygroundTool,
          report_issue: reportIssueTool
        },
        experimental_telemetry: {
          isEnabled: true,
          integrations: [createEvlogIntegration(ai)]
        },
        onFinish: () => {
          closeMcp()
        },
        onAbort: closeMcp,
        onError: closeMcp
      })

      writer.merge(result.toUIMessageStream({
        sendSources: true,
        originalMessages: messages,
        onFinish: ({ messages: finalizedMessages }) => {
          event.waitUntil(saveChat(finalizedMessages))
        }
      }))
    }
  })

  return createUIMessageStreamResponse({ stream })
})
