import { z } from 'zod'
import { readGlobalConfig } from '../global-config.js'

/**
 * Cross-cutting schedule tuning — the surface-specific settings (Slack channels,
 * Discord channels) live under their own `slack`/`discord` Global Config keys
 * (see `slack/config.ts`, `discord/access.ts`), editable from the dashboard
 * with no redeploy:
 *
 * ```json
 * "workflow": { "sinceDays": 7, "manualTrigger": false }
 * ```
 *
 * Validated with zod so a malformed dashboard edit (wrong type, typo'd key)
 * logs a clear warning and falls back to defaults instead of failing silently.
 */
const workflowConfigSchema = z.object({
  sinceDays: z.number().optional(),
  manualTrigger: z.boolean().optional()
})

export type WorkflowConfig = z.infer<typeof workflowConfigSchema>

export async function loadWorkflowConfig(): Promise<WorkflowConfig> {
  const config = await readGlobalConfig<{ workflow?: unknown }>(['workflow'])
  if (config.workflow === undefined) return {}

  const parsed = workflowConfigSchema.safeParse(config.workflow)
  if (!parsed.success) {
    console.warn('[nuxi:workflow-config] invalid `workflow` in Global Config, using defaults', parsed.error.flatten())
    return {}
  }
  return parsed.data
}
