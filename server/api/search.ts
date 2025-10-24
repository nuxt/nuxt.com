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
- "nuxt-ui" for UI components, design system, theming, templates

Question: ${lastMsg}`
  })

  const agents = await Promise.all(
    routing.agents.map(async (name) => {
      return {
        name,
        agent: await createAgent(name === 'nuxt-ui' ? NUXT_UI_AGENT_CONFIG : NUXT_AGENT_CONFIG)
      }
    })
  )

  const stream = createUIMessageStream({
    execute: async ({ writer }) => {
      const tools = Object.fromEntries(
        agents.map(({ name, agent }) => [
          `${name}-agent`,
          tool({
            description: name === 'nuxt'
              ? 'Nuxt framework expert: routing, composables, server, deployment, modules'
              : 'Nuxt UI library expert: components, design system, theming',
            inputSchema: z.object({ question: z.string() }),
            execute: async ({ question }) => {
              const stream = agent.stream({ prompt: question })
              let text = ''

              for await (const chunk of stream.fullStream) {
                if (chunk.type === 'tool-call') {
                  writer.write({
                    id: chunk.toolCallId,
                    type: 'data-tool-calls',
                    data: {
                      [name]: [{ toolName: chunk.toolName }]
                    }
                  })
                } else if (chunk.type === 'text-delta') {
                  text += chunk.text
                }
              }

              return text
            }
          })
        ])
      )

      const orchestrator = await createAgent({
        model: 'moonshotai/kimi-k2-turbo',
        expertise: ORCHESTRATOR_EXPERTISE,
        maxOutputTokens: 15000,
        stopWhen: stepCountIs(10),
        experimental_transform: smoothStream({ chunking: 'word' }),
        tools
      })

      writer.merge(
        orchestrator.stream({
          messages: convertToModelMessages(messages)
        }).toUIMessageStream()
      )
    },
    onFinish: async () => {
      await Promise.all(agents.map(({ agent }) => agent.close()))
    }
  })

  return createUIMessageStreamResponse({ stream })
})
