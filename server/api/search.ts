import { convertToModelMessages, createUIMessageStream, createUIMessageStreamResponse, tool, stepCountIs, smoothStream, generateObject } from 'ai'
import type { UIMessage } from 'ai'
import { z } from 'zod'

const routingSchema = z.object({
  agents: z.array(z.enum(['nuxt', 'nuxt-ui']))
})

export default defineEventHandler(async (event) => {
  const { messages } = await readValidatedBody(event, z.object({
    messages: z.array(z.custom<UIMessage>())
  }).parse)

  const lastMsg = messages[messages.length - 1].parts.map(part => part.type === 'text' ? part.text : '').join('')

  const { object: routing } = await generateObject({
    model: 'openai/gpt-4o-mini',
    schema: routingSchema,
    prompt: `Analyze this question and determine which agent(s) to use:
- "nuxt" for framework, modules, routing, composables, server, deployment
- "nuxt-ui" for UI components, design system, theming

Question: ${lastMsg}`
  })

  const agents = await Promise.all(
    routing.agents.map(async (name) => {
      if (name === 'nuxt-ui') {
        return { name, agent: await createAgent(NUXT_UI_AGENT_CONFIG) }
      }
      return { name, agent: await createAgent(NUXT_AGENT_CONFIG) }
    })
  )

  let streamWriter: any = null

  const tools = Object.fromEntries(
    agents.map(({ name, agent }) => [
      `${name}-agent`,
      tool({
        description: name === 'nuxt'
          ? 'Nuxt framework expert: routing, composables, server, deployment, modules'
          : 'Nuxt UI library expert: components, design system, theming',
        inputSchema: z.object({ question: z.string() }),
        execute: async ({ question }) => {
          const result = await agent.generate({ prompt: question })

          if (streamWriter && result.steps) {
            for (const step of result.steps) {
              if (step.toolCalls && step.toolCalls.length > 0) {
                streamWriter.write({
                  type: 'data-tool-calls',
                  data: {
                    agent: name,
                    toolCalls: step.toolCalls
                  }
                })
              }
            }
          }

          return result.text
        }
      })
    ])
  )

  const orchestrator = await createAgent({
    model: 'anthropic/claude-sonnet-4.5',
    expertise: ORCHESTRATOR_EXPERTISE,
    maxOutputTokens: 15000,
    stopWhen: stepCountIs(10),
    experimental_transform: smoothStream({ chunking: 'word' }),
    tools
  })

  const stream = createUIMessageStream({
    execute: ({ writer }) => {
      streamWriter = writer

      const agentStream = orchestrator.stream({
        messages: convertToModelMessages(messages)
      })

      writer.merge(agentStream.toUIMessageStream())
    },
    onFinish: async () => {
      await Promise.all([
        orchestrator.close(),
        ...agents.map(({ agent }) => agent.close())
      ])
    }
  })

  return createUIMessageStreamResponse({ stream })
})
