import { defineMcpClientConnection } from 'eve/connections'
import { appOrigin } from '../lib/internal-api.js'

export default defineMcpClientConnection({
  url: `${appOrigin()}/mcp`,
  description: 'Nuxt.com documentation, blog, modules catalog, deploy providers, and changelog.'
})
