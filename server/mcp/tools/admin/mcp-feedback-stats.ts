import { z } from 'zod'
import { and, count, desc, eq, gte, isNotNull, isNull, ne, type SQL } from 'drizzle-orm'

export default defineMcpTool({
  description: `Aggregated MCP agent feedback: total reports in a window, breakdown by source and tool, and top paths mentioned.

WHEN TO USE: Start here for a high-level read on what agents report about the Nuxt MCP / docs, then drill down with \`list-mcp-feedback\`.

SOURCES: \`nuxi\` is Nuxi reporting gaps it hit while answering users; \`mcp\` is third-party agents using the public MCP server. \`bySource\` always reports both; pass \`source\` to scope every other figure to one of them.

OUTPUT: Window metadata, totals, per-source counts, top tools, and top paths (sorted by count descending).`,
  inputSchema: {
    source: z.enum(['mcp', 'nuxi']).optional().describe('Scope totals, top tools and top paths to a single source (bySource stays global).'),
    sinceDays: z.number().int().min(1).max(365).default(30).describe('Window in days from now (default 30).'),
    topTools: z.number().int().min(1).max(50).default(10).describe('How many top tools to return.'),
    topPaths: z.number().int().min(1).max(50).default(10).describe('How many top paths to return.')
  },
  annotations: {
    readOnlyHint: true,
    openWorldHint: false
  },
  inputExamples: [
    { sinceDays: 7 },
    { source: 'nuxi', sinceDays: 7 },
    { sinceDays: 30, topTools: 15 }
  ],
  enabled: event => isMcpAdmin(event),
  async handler({ source, sinceDays, topTools, topPaths }) {
    const since = new Date(Date.now() - sinceDays * 24 * 60 * 60 * 1000)

    type CountRow = { key: string, count: number }

    /** Every figure but `bySource` honours the optional source filter. */
    const scoped = (...extra: SQL[]) => and(
      gte(schema.mcpFeedback.createdAt, since),
      ...(source ? [eq(schema.mcpFeedback.source, source)] : []),
      ...extra
    )

    const [
      totalRow,
      bySource,
      byTool,
      byPath,
      withSuggestionsRow,
      missingToolNameRow,
      missingPathRow
    ] = await Promise.all([
      db
        .select({ total: count() })
        .from(schema.mcpFeedback)
        .where(scoped())
        .then(rows => rows[0]),
      db
        .select({
          key: schema.mcpFeedback.source,
          count: count()
        })
        .from(schema.mcpFeedback)
        .where(gte(schema.mcpFeedback.createdAt, since))
        .groupBy(schema.mcpFeedback.source)
        .orderBy(desc(count())) as Promise<CountRow[]>,
      db
        .select({
          key: schema.mcpFeedback.toolName,
          count: count()
        })
        .from(schema.mcpFeedback)
        .where(scoped(isNotNull(schema.mcpFeedback.toolName)))
        .groupBy(schema.mcpFeedback.toolName)
        .orderBy(desc(count()))
        .limit(topTools) as Promise<CountRow[]>,
      db
        .select({
          key: schema.mcpFeedback.path,
          count: count()
        })
        .from(schema.mcpFeedback)
        .where(scoped(isNotNull(schema.mcpFeedback.path)))
        .groupBy(schema.mcpFeedback.path)
        .orderBy(desc(count()))
        .limit(topPaths) as Promise<CountRow[]>,
      db
        .select({ total: count() })
        .from(schema.mcpFeedback)
        .where(scoped(
          isNotNull(schema.mcpFeedback.suggestedFix),
          ne(schema.mcpFeedback.suggestedFix, '')
        ))
        .then(rows => rows[0]),
      db
        .select({ total: count() })
        .from(schema.mcpFeedback)
        .where(scoped(isNull(schema.mcpFeedback.toolName)))
        .then(rows => rows[0]),
      db
        .select({ total: count() })
        .from(schema.mcpFeedback)
        .where(scoped(isNull(schema.mcpFeedback.path)))
        .then(rows => rows[0])
    ])

    return {
      window: { sinceDays, since: since.toISOString(), source: source ?? 'all' },
      global: {
        total: totalRow?.total ?? 0,
        withSuggestedFix: withSuggestionsRow?.total ?? 0
      },
      bySource: bySource.map((r: CountRow) => ({ source: r.key, count: r.count })),
      topTools: byTool.map((r: CountRow) => ({ toolName: r.key, count: r.count })),
      topPaths: byPath.map((r: CountRow) => ({
        path: r.key,
        count: r.count,
        url: `https://nuxt.com${r.key}`
      })),
      uncategorized: {
        missingToolName: missingToolNameRow?.total ?? 0,
        missingPath: missingPathRow?.total ?? 0
      }
    }
  }
})
