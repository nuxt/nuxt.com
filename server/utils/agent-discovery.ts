import type { H3Event } from 'h3'
import { withoutTrailingSlash } from 'ufo'

export function getSiteUrl(event: H3Event): string {
  return withoutTrailingSlash(getSiteConfig(event).url)
}
