import { z } from 'zod'
import { and, count, gte, sql } from 'drizzle-orm'

const RATING_SCORES: Record<string, number> = {
  'very-helpful': 4,
  'helpful': 3,
  'not-helpful': 2,
  'confusing': 1
}

export default defineMcpTool({
  description: `Aggregated feedback metrics: global counts per rating, top problematic pages (most negative feedback), and an average satisfaction score.

WHEN TO USE: Start here to get a high-level read on docs satisfaction over a window, then drill down with \`admin_list_feedback\` on the worst-scoring pages.

OUTPUT: Returns global stats, breakdown by rating, and a list of pages sorted by lowest average score (worst first).`,
  inputSchema: {
    sinceDays: z.number().int().min(1).max(365).default(30).describe('Window in days from now (default 30).'),
    topPages: z.number().int().min(1).max(50).default(10).describe('How many of the worst-scoring pages to return.'),
    minResponses: z.number().int().min(1).default(3).describe('Minimum number of responses for a page to appear in the worst-pages list (default 3).')
  },
  annotations: {
    readOnlyHint: true,
    openWorldHint: false
  },
  inputExamples: [
    { sinceDays: 7 },
    { sinceDays: 30, topPages: 20, minResponses: 5 }
  ],
  enabled: event => isMcpAdmin(event),
  async handler({ sinceDays, topPages, minResponses }) {
    const since = new Date(Date.now() - sinceDays * 24 * 60 * 60 * 1000)

    type RatingRow = { rating: string, count: number }
    type PageRow = {
      path: string
      title: string
      total: number
      veryHelpful: number
      helpful: number
      notHelpful: number
      confusing: number
    }

    const [byRating, byPage] = await Promise.all([
      db
        .select({ rating: schema.feedback.rating, count: count() })
        .from(schema.feedback)
        .where(gte(schema.feedback.createdAt, since))
        .groupBy(schema.feedback.rating) as Promise<RatingRow[]>,
      db
        .select({
          path: schema.feedback.path,
          title: sql<string>`max(${schema.feedback.title})`,
          total: count(),
          veryHelpful: sql<number>`sum(case when ${schema.feedback.rating} = 'very-helpful' then 1 else 0 end)`,
          helpful: sql<number>`sum(case when ${schema.feedback.rating} = 'helpful' then 1 else 0 end)`,
          notHelpful: sql<number>`sum(case when ${schema.feedback.rating} = 'not-helpful' then 1 else 0 end)`,
          confusing: sql<number>`sum(case when ${schema.feedback.rating} = 'confusing' then 1 else 0 end)`
        })
        .from(schema.feedback)
        .where(and(gte(schema.feedback.createdAt, since)))
        .groupBy(schema.feedback.path) as Promise<PageRow[]>
    ])

    type Totals = { total: number, positive: number, negative: number, score: number }
    const totals = byRating.reduce<Totals>((acc, r) => {
      acc.total += r.count
      acc.score += (RATING_SCORES[r.rating] ?? 0) * r.count
      if (r.rating === 'very-helpful' || r.rating === 'helpful') acc.positive += r.count
      if (r.rating === 'not-helpful' || r.rating === 'confusing') acc.negative += r.count
      return acc
    }, { total: 0, positive: 0, negative: 0, score: 0 })

    const worstPages = byPage
      .filter((p: PageRow) => p.total >= minResponses)
      .map((p: PageRow) => {
        const score = (Number(p.veryHelpful) * 4 + Number(p.helpful) * 3 + Number(p.notHelpful) * 2 + Number(p.confusing) * 1) / p.total
        return {
          path: p.path,
          title: p.title,
          total: p.total,
          positive: Number(p.veryHelpful) + Number(p.helpful),
          negative: Number(p.notHelpful) + Number(p.confusing),
          averageScore: Math.round(score * 100) / 100,
          url: `https://nuxt.com${p.path}`
        }
      })
      .sort((a, b) => a.averageScore - b.averageScore)
      .slice(0, topPages)

    return {
      window: { sinceDays, since: since.toISOString() },
      global: {
        total: totals.total,
        positive: totals.positive,
        negative: totals.negative,
        averageScore: totals.total ? Math.round((totals.score / totals.total) * 100) / 100 : 0,
        positivePercentage: totals.total ? Math.round((totals.positive / totals.total) * 100) : 0
      },
      byRating: byRating
        .map((r: RatingRow) => ({ rating: r.rating, count: r.count }))
        .sort((a, b) => b.count - a.count),
      worstPages
    }
  }
})
