import { defineMemory } from 'eve/memory'
import { memoryOwner, nuxiMemory } from '../lib/memory.js'

// One document per person signed in on nuxt.com. Off everywhere else.
export default defineMemory({
  description: 'Your private notes about the person you\'re talking with: their stack (Nuxt version, modules, hosting), the projects they work on, and how they like answers. Only they see conversations that use it.',
  provider: nuxiMemory(),
  scope: ctx => memoryOwner(ctx.session.auth.current)
})
