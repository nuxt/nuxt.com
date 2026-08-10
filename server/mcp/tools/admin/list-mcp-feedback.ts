import { z } from 'zod'
import { and, desc, eq, gte, like, type SQL } from 'drizzle-orm'

export default defineMcpTool({
  description: `Lists agent-reported MCP / docs feedback from the public report-feedback tool.

WHEN TO USE: Review what AI agents reported about Nuxt MCP tools or documentation (errors, outdated content, missing info). Pair with \`mcp-feedback-stats\` for aggregates, then drill down here.

SOURCES: \`nuxi\` is Nuxi reporting gaps it hit while answering users on nuxt.com/Slack/Discord; \`mcp\` is third-party agents using the public MCP server. Filter with \`source\` when you only care about one.

OUTPUT: Rows ordered by most recent first (id, source, toolName, feedback, suggestedFix, path, country, createdAt).`,
  inputSchema: {
    source: z.enum(['mcp', 'nuxi']).optional().describe('Only include reports from this source (nuxi = the Nuxi agent itself, mcp = third-party MCP clients).'),
    toolName: z.string().optional().describe('Exact MCP tool name to filter on (e.g. get-documentation-page).'),
    pathContains: z.string().optional().describe('Substring match on the related path (e.g. "data-fetching", "/docs/4.x").'),
    sinceDays: z.number().int().min(1).max(365).optional().describe('Only include feedback from the last N days.'),
    limit: z.number().int().min(1).max(200).default(50).describe('Maximum number of rows to return (default 50, max 200).'),
    offset: z.number().int().min(0).default(0).describe('Pagination offset.')
  },
  annotations: {
    readOnlyHint: true,
    openWorldHint: false
  },
  inputExamples: [
    { sinceDays: 7, limit: 30 },
    { source: 'nuxi', sinceDays: 7 },
    { toolName: 'get-documentation-page', sinceDays: 30 }
  ],
  enabled: event => isMcpAdmin(event),
  async handler({ source, toolName, pathContains, sinceDays, limit, offset }) {
    const filters: SQL[] = []
    if (source) filters.push(eq(schema.mcpFeedback.source, source))
    if (toolName) filters.push(eq(schema.mcpFeedback.toolName, toolName))
    if (pathContains) filters.push(like(schema.mcpFeedback.path, `%${pathContains}%`))
    if (sinceDays) {
      const since = new Date(Date.now() - sinceDays * 24 * 60 * 60 * 1000)
      filters.push(gte(schema.mcpFeedback.createdAt, since))
    }

    type Row = Pick<McpFeedback, 'id' | 'source' | 'toolName' | 'feedback' | 'suggestedFix' | 'path' | 'country' | 'createdAt'>

    const rows: Row[] = await db
      .select({
        id: schema.mcpFeedback.id,
        source: schema.mcpFeedback.source,
        toolName: schema.mcpFeedback.toolName,
        feedback: schema.mcpFeedback.feedback,
        suggestedFix: schema.mcpFeedback.suggestedFix,
        path: schema.mcpFeedback.path,
        country: schema.mcpFeedback.country,
        createdAt: schema.mcpFeedback.createdAt
      })
      .from(schema.mcpFeedback)
      .where(filters.length ? and(...filters) : undefined)
      .orderBy(desc(schema.mcpFeedback.createdAt))
      .limit(limit)
      .offset(offset)

    return {
      total: rows.length,
      offset,
      limit,
      rows: rows.map((r: Row) => ({
        ...r,
        createdAt: r.createdAt instanceof Date ? r.createdAt.toISOString() : r.createdAt,
        url: r.path ? `https://nuxt.com${r.path}` : undefined
      }))
    }
  }
})
