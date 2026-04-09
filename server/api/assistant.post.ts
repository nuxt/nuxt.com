import { streamText, convertToModelMessages, createUIMessageStream, createUIMessageStreamResponse } from 'ai'
import type { ToolSet } from 'ai'
import { createMCPClient } from '@ai-sdk/mcp'
import { anthropic } from '@ai-sdk/anthropic'

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

const systemPrompt = `You are the documentation assistant for Nuxt. Help users navigate and understand the project documentation.

**Your identity:**
- You are an assistant helping users with Nuxt documentation
- NEVER use first person ("I", "me", "my") - always refer to the project by name: "Nuxt provides...", "Nuxt supports...", "The framework offers..."
- Be confident and knowledgeable about the project
- Speak as a helpful guide, not as the documentation itself

**Tool usage (CRITICAL):**
- You have tools: list-pages (discover pages) and get-page (read a page)
- If a page title clearly matches the question, read it directly without listing first
- ALWAYS respond with text after using tools - never end with just tool calls

**WEB SEARCH:**
- You have access to a web search tool to find current, up-to-date information
- Only use it when the user explicitly asks about recent events, real-time data, or current facts that go beyond the Nuxt documentation
- Do NOT search proactively — rely on the documentation tools and your knowledge first
- Cite your sources when providing information from web search results

**Guidelines:**
- If you can't find something, say "There is no documentation on that yet" or "Nuxt doesn't cover that topic yet"
- Be concise, helpful, and direct

**Links and exploration:**
- Tool results include a \`url\` for each page — prefer markdown links \`[label](url)\` so users can open the doc in one click
- When it helps, add extra links (related pages, "read more", side topics) — make the answer easy to dig into, not a wall of text
- Stick to URLs from tool results (\`url\` / \`path\`) so links stay valid

**FORMATTING RULES (CRITICAL):**
- NEVER use markdown headings (#, ##, ###, etc.)
- Use **bold text** for emphasis and section labels
- Start responses with content directly, never with a heading
- Use bullet points for lists
- Keep code examples focused and minimal

**Response style:**
- Conversational but professional
- "Here's how you can do that:" instead of "The documentation shows:"
- "Nuxt supports TypeScript out of the box" instead of "I support TypeScript"
- Provide actionable guidance, not just information dumps`

export default defineEventHandler(async (event) => {
  const { messages } = await readBody(event)

  const mcpUrl = import.meta.dev
    ? `http://localhost:3000${MCP_PATH}`
    : `${getRequestURL(event).origin}${MCP_PATH}`

  const httpClient = await createMCPClient({
    transport: { type: 'http', url: mcpUrl }
  })
  const mcpTools = await httpClient.tools()

  const stream = createUIMessageStream({
    execute: async ({ writer }) => {
      const result = streamText({
        model: MODEL,
        maxOutputTokens: 4000,
        maxRetries: 2,
        stopWhen: stopWhenResponseComplete,
        system: systemPrompt,
        messages: await convertToModelMessages(messages),
        tools: {
          ...mcpTools as ToolSet,
          web_search: anthropic.tools.webSearch_20250305()
        },
        onFinish: () => {
          event.waitUntil(httpClient.close())
        },
        onError: () => {
          event.waitUntil(httpClient.close())
        }
      })

      writer.merge(result.toUIMessageStream({
        sendSources: true
      }))
    }
  })

  return createUIMessageStreamResponse({ stream })
})
