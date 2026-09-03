import toc from 'comark/plugins/toc'
import emoji from 'comark/plugins/emoji'
import security from 'comark/plugins/security'
import markdownFields from 'comark-content/plugins/markdown-fields'
import type { ContentPlugin } from 'comark-content'
import type { DocVersion } from '#shared/utils/docs'
import type { ContentInstanceKey } from '#shared/utils/content'

/** Shared by every instance. Bump `CONTENT_PARSER_VERSION` when it changes: cached bodies keep the old output. */
export const comarkPlugins = [
  highlightPlugin,
  toc({ depth: 3 }),
  emoji(),
  security({
    blockedTags: ['script', 'iframe', 'embed', 'form', 'base', 'meta', 'link', 'style'],
    allowDataImages: false
  })
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
    ...(version === '3.x' ? [configDocs()] : [])
  ]
}
