import { z } from 'zod'
import { readGlobalConfig } from '../global-config.js'

/**
 * Slack workspace + channel refs, editable from the Vercel dashboard with no
 * redeploy (same rationale as `workflow`/`discord`):
 *
 * ```json
 * "slack": {
 *   "workspace": "vercel",
 *   "channels": {
 *     "digest": { "id": "C0123ABC", "name": "project-nuxi" },
 *     "firehose": { "id": "C0456DEF", "name": "firehose-nuxt" }
 *   }
 * }
 * ```
 *
 * Validated with zod so a malformed dashboard edit (wrong type, typo'd key)
 * logs a clear warning and falls back to defaults instead of failing silently.
 */
const slackChannelRefSchema = z.object({
  id: z.string().optional(),
  name: z.string().optional()
})

const slackConfigSchema = z.object({
  workspace: z.string().optional(),
  channels: z.object({
    digest: slackChannelRefSchema.optional(),
    firehose: slackChannelRefSchema.optional()
  }).optional()
})

export type SlackChannelRef = z.infer<typeof slackChannelRefSchema>
export type SlackConfig = z.infer<typeof slackConfigSchema>

export async function loadSlackConfig(): Promise<SlackConfig> {
  const config = await readGlobalConfig<{ slack?: unknown }>(['slack'])
  if (config.slack === undefined) return {}

  const parsed = slackConfigSchema.safeParse(config.slack)
  if (!parsed.success) {
    console.warn('[nuxi:slack] invalid `slack` in Global Config, using defaults', parsed.error.flatten())
    return {}
  }
  return parsed.data
}
