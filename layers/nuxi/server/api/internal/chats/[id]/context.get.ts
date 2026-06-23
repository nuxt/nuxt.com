import { asc, eq } from 'drizzle-orm'
import { z } from 'zod'

function messageText(parts: unknown): string {
  if (!Array.isArray(parts)) return ''
  return parts
    .filter((part): part is { type: string, text?: string } => !!part && typeof part === 'object' && part.type === 'text')
    .map(part => part.text ?? '')
    .join('\n')
    .trim()
}

export default defineEventHandler(async (event) => {
  requireInternalRequest(event)

  const { id } = await getValidatedRouterParams(event, z.object({
    id: z.uuid()
  }).parse)

  const chat = await db.query.chats.findFirst({
    where: () => eq(schema.chats.id, id),
    with: {
      messages: {
        orderBy: () => [asc(schema.messages.createdAt), asc(schema.messages.id)]
      }
    }
  })

  if (!chat?.messages.length) {
    return { summary: null }
  }

  const lines = chat.messages.map((message: { role: string, parts: unknown }) => {
    const text = messageText(message.parts)
    if (!text) return null
    return `${message.role}: ${text}`
  }).filter(Boolean)

  return {
    summary: lines.slice(-20).join('\n\n')
  }
})
