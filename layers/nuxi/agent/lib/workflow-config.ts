import { getAll } from '@vercel/global-config'

/**
 * Non-secret Eve workflow tuning, editable from the Vercel dashboard with no
 * redeploy (same rationale as `adminGithubLogins`/`discordAllowedChannels`):
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
 */
export interface WorkflowChannelRef {
  id?: string
  name?: string
}

export interface WorkflowConfig {
  sinceDays?: number
  manualTrigger?: boolean
  slack?: {
    workspace?: string
    channels?: {
      workflow?: WorkflowChannelRef
      firehose?: WorkflowChannelRef
    }
  }
  discord?: {
    channel?: string
  }
}

export async function loadWorkflowConfig(): Promise<WorkflowConfig> {
  const config = await getAll<{ workflow?: WorkflowConfig }>(['workflow'])
  return config.workflow ?? {}
}
