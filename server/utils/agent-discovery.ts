import type { H3Event } from 'h3'
import { withoutTrailingSlash } from 'ufo'

// Single source of truth for agent-facing surfaces (.well-known/*, /raw/**,
// sitemaps). Bumping `DOCS_VERSION` flips every link without grepping.
export const DOCS_VERSION = '4.x'

export function getSiteUrl(event: H3Event): string {
  return withoutTrailingSlash(getSiteConfig(event).url)
}
