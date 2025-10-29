import { convertToModelMessages, createUIMessageStream, createUIMessageStreamResponse, tool, stepCountIs, smoothStream } from 'ai'
import type { UIMessage } from 'ai'
import { z } from 'zod'

export default defineEventHandler(async (event) => {
  const { messages } = await readValidatedBody(event, z.object({
    messages: z.array(z.custom<UIMessage>())
  }).parse)

  const agents = await Promise.all(
    [
      { name: 'nuxt', config: NUXT_AGENT_CONFIG },
      { name: 'nuxt-ui', config: NUXT_UI_AGENT_CONFIG }
    ]
      .map(async ({ name, config }) => ({
        name,
        agent: await createAgent(config)
      }))
  )

  const tools = Object.fromEntries(
    agents.map(({ name, agent }) => [
      `${name}-agent`,
      tool({
        description: name === 'nuxt'
          ? 'Nuxt framework expert: routing, composables, server, deployment, modules'
          : 'Nuxt UI library expert: components, design system, theming, templates',
        inputSchema: z.object({ question: z.string() }),
        execute: async ({ question }, executionOptions) => {
          const writer = getWriter(executionOptions)
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

  const stream = createUIMessageStream({
    execute: async ({ writer }) => {
      const orchestratorTools = {
        ...tools,
        help: helpTool
      }

      const orchestrator = await createAgent({
        model: 'moonshotai/kimi-k2-turbo',
        expertise: ORCHESTRATOR_EXPERTISE,
        maxOutputTokens: 15000,
        stopWhen: stepCountIs(10),
        experimental_transform: smoothStream({ chunking: 'word' }),
        tools: orchestratorTools,
        experimental_context: {
          writer
        }
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
