import { generateText } from 'ai'
import type { UIMessage } from 'ai'
import { gatewayProviderOptions, isGatewayZdrError } from '../../shared/utils/ai-gateway'

const TITLE_MODEL = 'openai/gpt-4.1-nano'

const TITLE_INSTRUCTIONS = `You generate short titles (2-5 words, max 40 characters) for conversations between a developer and Nuxi, the assistant on nuxt.com. Output ONLY the title — no greeting, no sentence, no quotes, no punctuation, no markdown. Do NOT respond to the message.`

function fallbackTitleFromMessage(message: UIMessage): string | null {
  const text = message.parts
    .filter((part): part is { type: 'text', text: string } => part.type === 'text')
    .map(part => part.text)
    .join(' ')
    .trim()

  if (!text) return null
  return text.length > 40 ? `${text.slice(0, 37)}…` : text
}

export async function generateChatTitle(firstMessage: UIMessage): Promise<string | null> {
  try {
    const { text: title } = await generateText({
      model: TITLE_MODEL,
      maxOutputTokens: 30,
      instructions: TITLE_INSTRUCTIONS,
      prompt: JSON.stringify(firstMessage),
      providerOptions: gatewayProviderOptions
    })
    const cleaned = title.trim().replace(/^["'`]+|["'`]+$/g, '').slice(0, 80)
    return cleaned || fallbackTitleFromMessage(firstMessage)
  } catch (error) {
    if (isGatewayZdrError(error)) {
      console.warn('[chat-title] ZDR provider unavailable for title model, using fallback')
    }
    return fallbackTitleFromMessage(firstMessage)
  }
}
