import { z } from 'zod'
import { asc, eq } from 'drizzle-orm'

function extractText(parts: AgentMessagePart[]): string {
  return parts
    .filter(p => p.type === 'text' && p.text)
    .map(p => p.text!.trim())
    .join(' ')
}

export default defineMcpTool({
  description: `Retrieves the full content of a single AI agent chat session: stored messages (with extracted text per message), associated upvotes/downvotes, and usage stats.

WHEN TO USE: After spotting an interesting chat ID via \`admin_list_agent_chats\`, use this tool to read the actual conversation transcript and individual message-level votes.`,
  inputSchema: {
    chatId: z.string().min(1).describe('The chat session id (UUID-style string returned by list_agent_chats).'),
    includeRawParts: z.boolean().default(false).describe('If true, include the raw `parts` array on every message. Off by default to keep responses small.')
  },
  annotations: {
    readOnlyHint: true,
    openWorldHint: false
  },
  inputExamples: [
    { chatId: 'chat-abc123' },
    { chatId: 'chat-abc123', includeRawParts: true }
  ],
  enabled: event => isMcpAdmin(event),
  async handler({ chatId, includeRawParts }) {
    const [chat] = await db
      .select()
      .from(schema.chats)
      .where(eq(schema.chats.id, chatId))
      .limit(1)

    if (!chat) {
      throw createError({ statusCode: 404, message: `Agent chat not found: ${chatId}` })
    }

    type VoteRow = Pick<Vote, 'messageId' | 'isUpvoted'>
    const votes: VoteRow[] = await db
      .select({
        messageId: schema.votes.messageId,
        isUpvoted: schema.votes.isUpvoted
      })
      .from(schema.votes)
      .where(eq(schema.votes.chatId, chatId))

    const votesByMessage = new Map<string, VoteRow>(votes.map(v => [v.messageId, v]))

    type StoredMessageRow = Pick<ChatMessage, 'id' | 'role' | 'parts' | 'createdAt'>
    const storedMessages: StoredMessageRow[] = await db
      .select({
        id: schema.messages.id,
        role: schema.messages.role,
        parts: schema.messages.parts,
        createdAt: schema.messages.createdAt
      })
      .from(schema.messages)
      .where(eq(schema.messages.chatId, chatId))
      .orderBy(asc(schema.messages.createdAt))

    const messages = storedMessages.map((msg: StoredMessageRow) => {
      const vote = votesByMessage.get(msg.id)
      const parts = (msg.parts ?? []) as AgentMessagePart[]
      return {
        id: msg.id,
        role: msg.role,
        text: extractText(parts),
        ...(includeRawParts ? { parts } : {}),
        ...(vote ? { vote: vote.isUpvoted ? 'up' : 'down' } : {})
      }
    })

    return {
      id: chat.id,
      userId: chat.userId,
      title: chat.title,
      visibility: chat.visibility,
      model: chat.model,
      provider: chat.provider,
      stats: {
        inputTokens: chat.inputTokens,
        outputTokens: chat.outputTokens,
        estimatedCost: chat.estimatedCost,
        durationMs: chat.durationMs,
        requestCount: chat.requestCount,
        messageCount: messages.length
      },
      votes: {
        upvotes: votes.filter((v: VoteRow) => v.isUpvoted).length,
        downvotes: votes.filter((v: VoteRow) => !v.isUpvoted).length
      },
      createdAt: chat.createdAt,
      messages
    }
  }
})
