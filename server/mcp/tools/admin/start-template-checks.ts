import { z } from 'zod'

export default defineMcpTool({
  description: `Starts the template check (install, build and, for templates that need no secrets, start in Chromium and snapshot for live previews) on Vercel Sandbox, like the daily cron.

WHEN TO USE: To re-check templates after a fix, or to check the ones that fail. Each template runs a 4 vCPU sandbox for 1 to 15 minutes: pass \`slugs\` or \`failing\` rather than checking every template unless asked to.

OUTPUT: The run id and the templates it queued. Templates another run is already checking are skipped. Follow the results with \`template-check-status\`.`,
  inputSchema: {
    slugs: z.array(z.string().regex(/^[a-z0-9-]+$/)).max(50).optional().describe('Template slugs to check (e.g. `docus`). Omit, with `failing` off, to check every template.'),
    failing: z.boolean().default(false).describe('Only check templates whose last check did not pass.')
  },
  annotations: {
    readOnlyHint: false,
    destructiveHint: false,
    openWorldHint: true
  },
  inputExamples: [
    { slugs: ['docus'] },
    { failing: true }
  ],
  enabled: event => isMcpAdmin(event),
  async handler({ slugs, failing }) {
    const event = useEvent()
    return await startTemplateChecks(templateCheckBaseURL(event), { slugs, failing, trigger: 'mcp', startedBy: 'admin-mcp' })
  }
})
