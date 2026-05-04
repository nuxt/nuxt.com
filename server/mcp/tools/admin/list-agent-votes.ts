import { z } from 'zod'
import { and, desc, eq, gte, type SQL } from 'drizzle-orm'

function extractText(parts: AgentMessagePart[]): string {
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
    if (onlyDownvotes) filters.push(eq(schema.agentVotes.isUpvoted, false))
    if (onlyUpvotes) filters.push(eq(schema.agentVotes.isUpvoted, true))
    if (sinceDays) {
      const since = new Date(Date.now() - sinceDays * 24 * 60 * 60 * 1000)
      filters.push(gte(schema.agentVotes.createdAt, since))
    }

    type VoteJoinRow = Pick<AgentVote, 'chatId' | 'messageId' | 'isUpvoted'>
      & Pick<AgentChat, 'messages' | 'provider' | 'model'>
      & { votedAt: Date, chatCreatedAt: Date }

    const rows: VoteJoinRow[] = await db
      .select({
        chatId: schema.agentVotes.chatId,
        messageId: schema.agentVotes.messageId,
        isUpvoted: schema.agentVotes.isUpvoted,
        votedAt: schema.agentVotes.createdAt,
        messages: schema.agentChats.messages,
        provider: schema.agentChats.provider,
        model: schema.agentChats.model,
        chatCreatedAt: schema.agentChats.createdAt
      })
      .from(schema.agentVotes)
      .innerJoin(schema.agentChats, eq(schema.agentChats.id, schema.agentVotes.chatId))
      .where(filters.length ? and(...filters) : undefined)
      .orderBy(desc(schema.agentVotes.createdAt))
      .limit(limit)
      .offset(offset)

    return {
      total: rows.length,
      offset,
      limit,
      rows: rows.map((r: VoteJoinRow) => {
        const message = r.messages.find((m: AgentChatMessage) => m.id === r.messageId)
        return {
          chatId: r.chatId,
          messageId: r.messageId,
          vote: r.isUpvoted ? 'up' : 'down',
          votedAt: r.votedAt,
          provider: r.provider,
          model: r.model,
          chatCreatedAt: r.chatCreatedAt,
          messageRole: message?.role,
          messageText: message ? extractText(message.parts).slice(0, 1000) : undefined
        }
      })
    }
  }
})
