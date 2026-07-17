import { z } from 'zod'
import { count, eq, gte, sql } from 'drizzle-orm'

export default defineMcpTool({
  description: `Nuxt.com-specific agent quality metrics: persisted web chat counts, message volume, and per-answer votes.

For runs, tokens, cost, duration, and channel breakdown (Slack vs web), use **Vercel Observability → Agent Runs** on the nuxt project — Eve records that data automatically and it is more accurate than anything stored locally.

WHEN TO USE: Quality and product signals (votes, saved web chats). For traffic/spend, point the team to Vercel o11y instead.`,
  inputSchema: {
    sinceDays: z.number().int().min(1).max(365).default(30).describe('Window in days from now (default 30).')
  },
  annotations: {
    readOnlyHint: true,
    openWorldHint: false
  },
  inputExamples: [
    { sinceDays: 7 },
    { sinceDays: 30 }
  ],
  enabled: event => isMcpAdmin(event),
  async handler({ sinceDays }) {
    const since = new Date(Date.now() - sinceDays * 24 * 60 * 60 * 1000)

    const [webRow] = await db
      .select({
        chatsCreated: count(),
        uniqueUsers: sql<number>`count(distinct ${schema.chats.userId})`
      })
      .from(schema.chats)
      .where(gte(schema.chats.createdAt, since))

    const [messageRow] = await db
      .select({ total: count() })
      .from(schema.messages)
      .innerJoin(schema.chats, eq(schema.chats.id, schema.messages.chatId))
      .where(gte(schema.chats.createdAt, since))

    const [voteRow] = await db
      .select({
        upvotes: sql<number>`sum(case when ${schema.votes.isUpvoted} = 1 then 1 else 0 end)`,
        downvotes: sql<number>`sum(case when ${schema.votes.isUpvoted} = 0 then 1 else 0 end)`
      })
      .from(schema.votes)
      .innerJoin(schema.chats, eq(schema.chats.id, schema.votes.chatId))
      .where(gte(schema.chats.createdAt, since))

    const upvotes = Number(voteRow?.upvotes ?? 0)
    const downvotes = Number(voteRow?.downvotes ?? 0)
    const totalVotes = upvotes + downvotes

    return {
      window: { sinceDays, since: since.toISOString() },
      observability: {
        note: 'Runs, tokens, cost, duration, and triggers (Slack, web) live in Vercel Observability → Agent Runs for the nuxt project. Do not infer usage or spend from this tool.',
        location: 'Vercel dashboard → nuxt project → Observability → Agent Runs'
      },
      web: {
        chatsCreated: Number(webRow?.chatsCreated ?? 0),
        uniqueSignedInUsers: Number(webRow?.uniqueUsers ?? 0),
        messagesStored: Number(messageRow?.total ?? 0)
      },
      votes: {
        upvotes,
        downvotes,
        total: totalVotes,
        downvoteRate: totalVotes ? Math.round((downvotes / totalVotes) * 100) : 0
      }
    }
  }
})
