import { resolveContext, type AuthContext } from '../identity/context.js'
import {
  digestSlackChannelRef,
  firehoseSlackChannelRef,
  isSlackChannelMember,
  resolveSlackChannelRef
} from './api.js'

async function configuredSlackChannelIds(): Promise<Set<string>> {
  const refs = await Promise.all([digestSlackChannelRef(), firehoseSlackChannelRef()])
  const ids = await Promise.all(refs.map(ref => resolveSlackChannelRef(ref).then(channel => channel.id, () => null)))
  return new Set(ids.filter((id): id is string => id !== null))
}

/**
 * Scheduled runs can read any channel Nuxi is in, and the configured digest/firehose
 * channels are open to every admin caller. Any other channel requires the Slack caller
 * to be a member of it.
 */
export async function canReadSlackChannel(auth: AuthContext | null | undefined, channelId: string): Promise<boolean> {
  const ctx = resolveContext(auth)
  if (ctx.surface === 'schedule') return true
  if ((await configuredSlackChannelIds()).has(channelId)) return true
  if (ctx.surface !== 'slack' || !ctx.person || ctx.person.isBot) return false
  return await isSlackChannelMember(channelId, ctx.person.id)
}
