import { defineMcpClientConnection } from 'eve/connections'
import { docsMcpOrigin } from '../lib/internal-api.js'

export default defineMcpClientConnection({
  url: `${docsMcpOrigin()}/mcp`,
  description: 'Nuxt.com documentation, blog, modules catalog, deploy providers, and changelog.'
})
