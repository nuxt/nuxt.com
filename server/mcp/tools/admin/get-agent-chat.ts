import { z } from 'zod'
import { eq } from 'drizzle-orm'

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
      .from(schema.agentChats)
      .where(eq(schema.agentChats.id, chatId))
      .limit(1)

    if (!chat) {
      throw createError({ statusCode: 404, message: `Agent chat not found: ${chatId}` })
    }

    type VoteRow = Pick<AgentVote, 'messageId' | 'isUpvoted' | 'createdAt'>
    const votes: VoteRow[] = await db
      .select({
        messageId: schema.agentVotes.messageId,
        isUpvoted: schema.agentVotes.isUpvoted,
        createdAt: schema.agentVotes.createdAt
      })
      .from(schema.agentVotes)
      .where(eq(schema.agentVotes.chatId, chatId))

    const votesByMessage = new Map<string, VoteRow>(votes.map(v => [v.messageId, v]))

    const messages = chat.messages.map((msg: AgentChatMessage) => {
      const vote = votesByMessage.get(msg.id)
      return {
        id: msg.id,
        role: msg.role,
        text: extractText(msg.parts),
        ...(includeRawParts ? { parts: msg.parts } : {}),
        ...(vote ? { vote: vote.isUpvoted ? 'up' : 'down', votedAt: vote.createdAt } : {})
      }
    })

    return {
      id: chat.id,
      fingerprint: chat.fingerprint,
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
      updatedAt: chat.updatedAt,
      messages
    }
  }
})
