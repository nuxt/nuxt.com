import { z } from 'zod'
import { and, desc, gte, inArray, like, lte, type SQL } from 'drizzle-orm'

export default defineMcpTool({
  description: `Lists user feedback entries from the docs site, with filters for rating, page path, and date range.

WHEN TO USE: Use this tool to surface what users are saying about specific docs pages, especially negative feedback ("not-helpful" / "confusing"). Combine with \`admin_feedback_stats\` for aggregated trends first, then drill down with this tool.

OUTPUT: Returns feedback rows (id, rating, comment, path, title, country, dates) ordered by most recent first. Pass \`pathContains\` to filter by URL substring (e.g., "data-fetching") and \`ratings\` to focus on negatives.`,
  inputSchema: {
    ratings: z.array(z.enum(FEEDBACK_RATINGS)).optional().describe('Restrict to specific ratings. If omitted, returns all ratings.'),
    pathContains: z.string().optional().describe('Substring match on the page path (e.g., "data-fetching", "/docs/4.x").'),
    sinceDays: z.number().int().min(1).max(365).optional().describe('Only include feedback from the last N days.'),
    until: z.string().datetime({ offset: true }).optional().describe('Upper bound on createdAt as an ISO 8601 datetime.'),
    limit: z.number().int().min(1).max(200).default(50).describe('Maximum number of feedback rows to return (default 50, max 200).'),
    offset: z.number().int().min(0).default(0).describe('Pagination offset.')
  },
  annotations: {
    readOnlyHint: true,
    openWorldHint: false
  },
  inputExamples: [
    { ratings: ['not-helpful', 'confusing'], sinceDays: 7 },
    { pathContains: '/docs/4.x/getting-started', limit: 20 }
  ],
  enabled: event => isMcpAdmin(event),
  async handler({ ratings, pathContains, sinceDays, until, limit, offset }) {
    const filters: SQL[] = []
    if (ratings?.length) filters.push(inArray(schema.feedback.rating, ratings))
    if (pathContains) filters.push(like(schema.feedback.path, `%${pathContains}%`))
    if (sinceDays) {
      const since = new Date(Date.now() - sinceDays * 24 * 60 * 60 * 1000)
      filters.push(gte(schema.feedback.createdAt, since))
    }
    if (until) filters.push(lte(schema.feedback.createdAt, new Date(until)))

    type FeedbackRow = Pick<Feedback, 'id' | 'rating' | 'feedback' | 'path' | 'title' | 'country' | 'createdAt' | 'updatedAt'>

    const rows: FeedbackRow[] = await db
      .select({
        id: schema.feedback.id,
        rating: schema.feedback.rating,
        feedback: schema.feedback.feedback,
        path: schema.feedback.path,
        title: schema.feedback.title,
        country: schema.feedback.country,
        createdAt: schema.feedback.createdAt,
        updatedAt: schema.feedback.updatedAt
      })
      .from(schema.feedback)
      .where(filters.length ? and(...filters) : undefined)
      .orderBy(desc(schema.feedback.createdAt))
      .limit(limit)
      .offset(offset)

    return {
      total: rows.length,
      offset,
      limit,
      rows: rows.map((r: FeedbackRow) => ({
        ...r,
        url: `https://nuxt.com${r.path}`
      }))
    }
  }
})
