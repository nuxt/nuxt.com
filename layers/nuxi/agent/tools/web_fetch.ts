import { defineTool } from 'eve/tools'
import { webFetch } from 'eve/tools/defaults'

/**
 * The built-in fetches any URL, which from an unauthenticated chat widget is an
 * SSRF surface. So it stays closed in spirit: this override keeps the default
 * schema and executor but refuses anything outside nuxt.com, leaving Nuxi able
 * to reach only the site it already reads through `nuxt-mcp`.
 *
 * That covers the one case the model kept promising and could not deliver — the
 * docs MCP failing — without reopening the surface. Redirects are still the
 * executor's to follow, so this holds because we own where nuxt.com redirects
 * to, not because the check is airtight.
 */
function isAllowedHost(hostname: string): boolean {
  return hostname === 'nuxt.com' || hostname.endsWith('.nuxt.com')
}

export default defineTool({
  ...webFetch,
  description: [
    webFetch.description,
    '',
    '**Restricted to nuxt.com.** Every other host is refused. Use it only to read a nuxt.com page when the nuxt-mcp connection fails, never as a general web browser.'
  ].join('\n'),
  async execute(input, ctx) {
    const { url } = input as { url: string }

    let parsed: URL
    try {
      parsed = new URL(url)
    } catch {
      throw new Error(`Not a valid URL: ${url}`)
    }

    if (parsed.protocol !== 'https:' || !isAllowedHost(parsed.hostname)) {
      throw new Error(
        `web_fetch is restricted to https://nuxt.com — refused ${parsed.origin}. Use the nuxt-mcp connection for documentation, or tell the user you cannot reach that page.`
      )
    }

    return await webFetch.execute!(input, ctx)
  }
})
