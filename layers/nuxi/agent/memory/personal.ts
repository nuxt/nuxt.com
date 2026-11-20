import { defineMemory } from 'eve/memory'
import { currentConversation, nuxiMemory, scopeAuth } from '../lib/memory.js'

// One document per person, only where no one else reads along: signed-in nuxt.com web chat
// and Slack DMs. Off in shared Slack conversations, so notes about one person never show up
// in a thread other people read.
export default defineMemory({
  description: 'Your private notes about the person you\'re talking with: their stack (Nuxt version, modules, hosting), the projects they work on, and how they like answers. Only they see conversations that use it.',
  provider: nuxiMemory(),
  scope(ctx) {
    const conversation = currentConversation(scopeAuth(ctx))
    return conversation?.kind === 'private' ? conversation.owner : null
  }
})
