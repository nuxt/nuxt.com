import toc from 'comark/plugins/toc'
import emoji from 'comark/plugins/emoji'
import security from 'comark/plugins/security'
import markdownFields from 'comark-content/plugins/markdown-fields'
import type { ContentPlugin } from 'comark-content'
// Explicit, not auto-imported: `modules/snapshot/` imports this file outside nitro.
import { highlightPlugin } from './highlight'
import { dottedFrontmatter } from './dotted-frontmatter'
import { docsLinks } from './docs-links'
import { cliDocs } from './cli-docs'
import { configDocs } from './config-docs'
import { sanitizeData } from './sanitize-data'
import type { DocVersion } from '../../../../shared/utils/docs'
import type { ContentInstanceKey } from '../../../../shared/utils/content'

/** One policy for Markdown (`security()`) and every file's data (`sanitizeData()`). */
export const SECURITY_OPTIONS = {
  blockedTags: ['script', 'iframe', 'embed', 'form', 'base', 'meta', 'link', 'style'],
  allowDataImages: false
}

/** Sanitizes Markdown bodies and their frontmatter, on a full parse. */
const securityPlugin = security(SECURITY_OPTIONS)

/**
 * Sanitizes every file's data (YAML not handled by `security()`)
 */
export const sanitizePlugin = sanitizeData(SECURITY_OPTIONS)

/**
 * The comark plugin chain every instance parses markdown with.
 * Bump `CONTENT_PARSER_VERSION` when it changes: cached bodies keep the old output.
 */
export const comarkPlugins = [
  highlightPlugin,
  toc({ depth: 3 }),
  emoji(),
  securityPlugin
]

/** Per-instance plugins, on top of the shared `markdown()`/`yaml()`/`json()` chain. */
export function instancePlugins(key: ContentInstanceKey): ContentPlugin[] {
  if (key === 'site') return [markdownFields()]
  if (key === 'examples') return [dottedFrontmatter()]
  if (key.startsWith('cli:')) {
    const version = key.slice('cli:'.length) as DocVersion
    // Command pages are written with the same unversioned `/docs/*` links as the docs.
    return [dottedFrontmatter(), docsLinks(version), cliDocs(version)]
  }

  const version = key.slice('docs:'.length) as DocVersion

  return [
    dottedFrontmatter(),
    docsLinks(version),
    // 3.x is the only version with the marker, and the only one publishing `config.schema.json`.
    // Passed the chain rather than importing it: `configDocs` is imported here, so it cannot import back.
    ...(version === '3.x' ? [configDocs(comarkPlugins)] : [])
  ]
}
