import { generateText } from 'ai'
import type { UIMessage } from 'ai'

const TITLE_MODEL = 'openai/gpt-4.1-nano'

const TITLE_SYSTEM = `You generate short titles (2-5 words, max 40 characters) for conversations between a developer and Nuxi, the assistant on nuxt.com. Output ONLY the title — no greeting, no sentence, no quotes, no punctuation, no markdown. Do NOT respond to the message.`

export async function generateChatTitle(firstMessage: UIMessage): Promise<string | null> {
  try {
    const { text: title } = await generateText({
      model: TITLE_MODEL,
      maxOutputTokens: 30,
      system: TITLE_SYSTEM,
      prompt: JSON.stringify(firstMessage)
    })
    const cleaned = title.trim().replace(/^["'`]+|["'`]+$/g, '').slice(0, 80)
    return cleaned || null
  } catch {
    return null
  }
}
