import raycast from 'eve-raycast'
import { raycastAuthAdapter } from '../lib/raycast.js'
import { appOrigin } from '../lib/internal-api.js'

export default raycast({
  basePath: '/eve/v1/raycast',
  // Nuxt's local proxy does not forward the public website origin.
  publicOrigin: process.env.VERCEL_URL ? undefined : appOrigin(),
  bot: {
    id: 'nuxi',
    name: 'Nuxi',
    description: 'Your Nuxt companion',
    icon: '/nuxi.png'
  },
  auth: raycastAuthAdapter
})
