import { defineMemory } from 'eve/memory'
import { currentConversation, nuxiMemory, scopeAuth } from '../lib/memory.js'

// One shared document per Slack channel, for everyone who can reach Nuxi there. Off in DMs
// and outside Slack.
export default defineMemory({
  description: 'Shared notes about this Slack channel: what it is for, its conventions, who owns what, and recurring requests. Everyone in the channel sees what you recall from it, so never save personal or sensitive details here.',
  provider: nuxiMemory(),
  scope(ctx) {
    const conversation = currentConversation(scopeAuth(ctx))
    return conversation?.kind === 'slack-channel' ? [conversation.teamId, conversation.channelId] : null
  }
})
