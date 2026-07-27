import { disableTool } from 'eve/tools'

// Arbitrary URL fetching from a public chat is an SSRF surface with no upside:
// nuxt.com content comes from nuxt-mcp, and `web_search` covers the rest.
export default disableTool()
