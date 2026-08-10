import { z } from 'zod'

export default defineMcpTool({
  description: `Report feedback or issues with Nuxt MCP tools or documentation.

WHEN TO USE: Call this when you encounter errors, wrong or outdated content, hallucinated or mismatched docs vs actual Nuxt behavior, missing information, or a tool that returned unusable results. Prefer concrete reports (what you tried, what you expected, what you got) over vague complaints.

WHEN NOT TO USE: Do not use for general Nuxt product support unrelated to this MCP server or its docs. Do not spam repeated identical reports — this is rate-limited per caller.

OUTPUT: A short acknowledgment plus the remaining daily quota.`,
  inputSchema: {
    toolName: z.string().max(100).optional().describe('Name of the MCP tool the feedback relates to (e.g. get-documentation-page).'),
    feedback: z.string().trim().min(1).max(2000).describe('Detailed description of the issue or improvement suggestion (max 2000 chars).'),
    suggestedFix: z.string().trim().max(2000).optional().describe('Optional suggestion for how to fix the tool or documentation (max 2000 chars).'),
    path: z.string().max(300).optional().describe('Optional docs/blog path involved (e.g. /docs/4.x/getting-started/installation).')
  },
  annotations: {
    readOnlyHint: false,
    openWorldHint: false
  },
  inputExamples: [
    {
      toolName: 'get-documentation-page',
      path: '/docs/4.x/getting-started/installation',
      feedback: 'Page markdown omitted the existing-project install section that list-documentation-pages described.',
      suggestedFix: 'Include the "Existing project" h2 section in the returned markdown.'
    }
  ],
  async handler({ toolName, feedback, suggestedFix, path }) {
    const event = useEvent()
    const source: McpFeedbackSource = isInternalRequest(event) ? 'nuxi' : 'mcp'
    const fingerprint = source === 'nuxi'
      ? NUXI_FEEDBACK_FINGERPRINT
      : await getFeedbackFingerprint(event)

    const duplicate = await findDuplicateMcpFeedback(fingerprint, feedback, toolName, path)
    if (duplicate) {
      return {
        ok: true,
        message: 'Already reported today — thanks, no need to send it again.'
      }
    }

    const { remaining } = await consumeMcpFeedbackRateLimit(fingerprint, mcpFeedbackDailyLimit(source))

    const country = event.context.cf?.country || 'unknown'

    await db.insert(schema.mcpFeedback).values({
      toolName: toolName || null,
      feedback,
      suggestedFix: suggestedFix || null,
      path: path || null,
      source,
      fingerprint,
      country,
      createdAt: new Date()
    })

    return {
      ok: true,
      message: 'Feedback received. Thank you — the Nuxt team will use this to improve the MCP and docs.',
      remainingToday: remaining
    }
  }
})
