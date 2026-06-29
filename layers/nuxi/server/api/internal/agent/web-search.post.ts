import { generateText } from 'ai'
import { z } from 'zod'

export default defineEventHandler(async (event) => {
  requireInternalRequest(event)

  const { query } = await readValidatedBody(event, z.object({
    query: z.string().min(1)
  }).parse)

  try {
    const { text } = await generateText({
      model: 'anthropic/claude-sonnet-4.6',
      maxOutputTokens: 2000,
      prompt: `The user requested a web search for: "${query}". Summarize the most relevant, up-to-date findings briefly. If you are uncertain about recency, say so.`
    })

    return { summary: text }
  } catch (error) {
    console.error('[web-search] provider error', error)
    return {
      error: 'Web search failed. Please try again later.'
    }
  }
})
