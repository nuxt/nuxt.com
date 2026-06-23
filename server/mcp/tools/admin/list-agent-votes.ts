import { z } from 'zod'
import { and, desc, eq, gte, type SQL } from 'drizzle-orm'

function extractText(parts: MessagePart[]): string {
  return parts
    .filter(p => p.type === 'text' && p.text)
    .map(p => p.text!.trim())
    .join(' ')
}

export default defineMcpTool({
  description: `Lists per-message votes (upvotes/downvotes) on AI agent answers, joined with chat metadata and the actual voted message text.

WHEN TO USE: Use this tool to read what users actually disliked. Default sort is most recent vote first; pass \`onlyDownvotes\` to focus on negative signal.`,
  inputSchema: {
    onlyDownvotes: z.boolean().default(false).describe('If true, return only downvotes.'),
    onlyUpvotes: z.boolean().default(false).describe('If true, return only upvotes.'),
    sinceDays: z.number().int().min(1).max(365).optional().describe('Only include votes from the last N days.'),
    limit: z.number().int().min(1).max(200).default(50).describe('Maximum number of votes to return.'),
    offset: z.number().int().min(0).default(0).describe('Pagination offset.')
  },
  annotations: {
    readOnlyHint: true,
    openWorldHint: false
  },
  inputExamples: [
    { onlyDownvotes: true, sinceDays: 7 },
    { sinceDays: 30, limit: 100 }
  ],
  enabled: event => isMcpAdmin(event),
  async handler({ onlyDownvotes, onlyUpvotes, sinceDays, limit, offset }) {
    if (onlyDownvotes && onlyUpvotes) {
      throw createError({ statusCode: 400, message: 'Pass at most one of `onlyDownvotes` / `onlyUpvotes`.' })
    }

    const filters: SQL[] = []
    if (onlyDownvotes) filters.push(eq(schema.votes.isUpvoted, false))
    if (onlyUpvotes) filters.push(eq(schema.votes.isUpvoted, true))
    if (sinceDays) {
      const since = new Date(Date.now() - sinceDays * 24 * 60 * 60 * 1000)
      filters.push(gte(schema.chats.createdAt, since))
    }

    type VoteJoinRow = {
      chatId: string
      messageId: string
      isUpvoted: boolean
      provider: string | null
      model: string | null
      chatCreatedAt: Date
      messageRole: 'user' | 'assistant' | 'system' | null
      messageParts: MessagePart[] | null
    }

    const rows: VoteJoinRow[] = await db
      .select({
        chatId: schema.votes.chatId,
        messageId: schema.votes.messageId,
        isUpvoted: schema.votes.isUpvoted,
        provider: schema.chats.provider,
        model: schema.chats.model,
        chatCreatedAt: schema.chats.createdAt,
        messageRole: schema.messages.role,
        messageParts: schema.messages.parts as never
      })
      .from(schema.votes)
      .innerJoin(schema.chats, eq(schema.chats.id, schema.votes.chatId))
      .leftJoin(schema.messages, and(
        eq(schema.messages.chatId, schema.votes.chatId),
        eq(schema.messages.id, schema.votes.messageId)
      ))
      .where(filters.length ? and(...filters) : undefined)
      .orderBy(desc(schema.chats.createdAt))
      .limit(limit)
      .offset(offset)

    return {
      total: rows.length,
      offset,
      limit,
      rows: rows.map((r: VoteJoinRow) => ({
        chatId: r.chatId,
        messageId: r.messageId,
        vote: r.isUpvoted ? 'up' : 'down',
        provider: r.provider,
        model: r.model,
        chatCreatedAt: r.chatCreatedAt,
        messageRole: r.messageRole,
        messageText: r.messageParts ? extractText(r.messageParts).slice(0, 1000) : undefined
      }))
    }
  }
})
