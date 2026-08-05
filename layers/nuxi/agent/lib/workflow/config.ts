import { z } from 'zod'
import { readGlobalConfig } from '../global-config.js'

/**
 * Non-secret Eve workflow tuning, editable from the Vercel dashboard with no
 * redeploy (same rationale as `adminGithubLogins`/`discordChannels`):
 *
 * ```json
 * "workflow": {
 *   "sinceDays": 7,
 *   "manualTrigger": false,
 *   "slack": {
 *     "workspace": "vercel",
 *     "channels": {
 *       "workflow": { "id": "C0123ABC", "name": "project-nuxi" },
 *       "firehose": { "id": "C0456DEF", "name": "firehose-nuxt" }
 *     }
 *   },
 *   "discord": { "channel": "1234567890123456" }
 * }
 * ```
 *
 * Validated with zod so a malformed dashboard edit (wrong type, typo'd key)
 * logs a clear warning and falls back to defaults instead of failing silently.
 */
const workflowChannelRefSchema = z.object({
  id: z.string().optional(),
  name: z.string().optional()
})

const workflowConfigSchema = z.object({
  sinceDays: z.number().optional(),
  manualTrigger: z.boolean().optional(),
  slack: z.object({
    workspace: z.string().optional(),
    channels: z.object({
      workflow: workflowChannelRefSchema.optional(),
      firehose: workflowChannelRefSchema.optional()
    }).optional()
  }).optional(),
  discord: z.object({
    channel: z.string().optional()
  }).optional()
})

export type WorkflowChannelRef = z.infer<typeof workflowChannelRefSchema>
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
