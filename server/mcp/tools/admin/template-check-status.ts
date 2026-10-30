import { z } from 'zod'
import { desc } from 'drizzle-orm'

export default defineMcpTool({
  description: `The last template check of each template, and the latest check runs.

WHEN TO USE: To see which templates fail and why, or to follow a run started with \`start-template-checks\` (\`state\` is \`queued\` or \`running\` until it finishes).

OUTPUT: One entry per template: \`state\`, the current \`phase\` while it runs, the last \`status\` (\`passed\` or \`failed\`), the failing \`step\` (\`install\`, \`build\` or \`start\`), the Nuxt version installed, whether it has a live preview snapshot, and the end of its log with \`includeLog\` (the failing step's output, or the live output while it runs).`,
  inputSchema: {
    slugs: z.array(z.string().regex(/^[a-z0-9-]+$/)).max(50).optional().describe('Template slugs to return. Omit for every template.'),
    only: z.enum(['failed', 'running']).optional().describe('`failed`: templates whose last check failed. `running`: templates queued or being checked.'),
    includeLog: z.boolean().default(false).describe('Include the last 4000 characters of each log. Off by default to keep responses small.')
  },
  annotations: {
    readOnlyHint: true,
    openWorldHint: false
  },
  inputExamples: [
    { only: 'failed', includeLog: true },
    { slugs: ['docus'], includeLog: true }
  ],
  enabled: event => isMcpAdmin(event),
  async handler({ slugs, only, includeLog }) {
    const [rows, runs] = await Promise.all([
      listTemplateChecks(),
      db.select().from(schema.templateCheckRuns).orderBy(desc(schema.templateCheckRuns.startedAt)).limit(5)
    ])

    const templates = rows
      .filter(row => !slugs?.length || slugs.includes(row.slug))
      .filter(row => only === 'failed' ? row.status === 'failed' : only === 'running' ? row.state !== 'idle' : true)
      .sort((a, b) => a.slug.localeCompare(b.slug))
      .map(row => ({
        slug: row.slug,
        state: row.state,
        phase: row.phase,
        status: row.status,
        step: row.step,
        nuxt: row.nuxt,
        live: row.status === 'passed' && !!row.snapshotId,
        seconds: row.seconds,
        checkedAt: row.checkedAt?.toISOString() ?? null,
        passedAt: row.passedAt?.toISOString() ?? null,
        ...(includeLog ? { log: row.log?.slice(-4000) ?? null } : {})
      }))

    return {
      templates,
      runs: runs.map(run => ({
        id: run.id,
        runId: run.runId,
        state: run.state,
        trigger: run.trigger,
        total: run.total,
        startedAt: run.startedAt.toISOString(),
        finishedAt: run.finishedAt?.toISOString() ?? null
      }))
    }
  }
})
