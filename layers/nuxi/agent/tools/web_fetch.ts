import { disableTool } from 'eve/tools'

// Arbitrary URL fetching from a public chat is an SSRF surface with no upside:
// nuxt.com content comes from nuxt-mcp, and `web_search` covers the rest.
// `web_search` is a provider-resolved built-in and stays enabled, so a failing
// nuxt-mcp call already has a fallback — see the instructions, which is where
// the model needs permission to use it, not here.
export default disableTool()
