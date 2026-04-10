import type { H3Event } from 'h3'
import type { Collections, CollectionQueryBuilder } from '@nuxt/content'
import { queryCollection } from '@nuxt/content/server'

type QueryCollectionWithEvent = <T extends keyof Collections>(event: H3Event, collection: T) => CollectionQueryBuilder<Collections[T]>

export default defineCachedEventHandler(async (event: H3Event) => {
  const [docsV4, docsV3, blog, deploy] = await Promise.all([
    (queryCollection as QueryCollectionWithEvent)(event, 'docsv4')
      .select('title', 'path', 'description')
      .where('path', 'NOT LIKE', '%.navigation')
      .all(),
    (queryCollection as QueryCollectionWithEvent)(event, 'docsv3')
      .select('title', 'path', 'description')
      .where('path', 'NOT LIKE', '%.navigation')
      .all(),
    (queryCollection as QueryCollectionWithEvent)(event, 'blog')
      .select('title', 'path', 'description')
      .where('draft', '=', 0)
      .all(),
    (queryCollection as QueryCollectionWithEvent)(event, 'deploy')
      .select('title', 'path', 'description')
      .all()
  ])

  const lines: string[] = [
    '# Nuxt Sitemap',
    '',
    '> Structured index of all pages on [nuxt.com](https://nuxt.com) for AI agents and documentation crawlers.',
    '',
    '## Discovery',
    '',
    '- [/llms.txt](/llms.txt) — Structured documentation index (llms.txt spec)',
    '- [/llms-full.txt](/llms-full.txt) — Complete documentation in a single file',
    '- [/sitemap.xml](/sitemap.xml) — XML sitemap for search engines',
    '- [/sitemap.md](/sitemap.md) — This file',
    '',
    '## Nuxt v4 Documentation (Current Stable)',
    ''
  ]

  for (const doc of docsV4) {
    const desc = doc.description ? ` — ${doc.description}` : ''
    lines.push(`- [${doc.title}](${doc.path})${desc}`)
  }

  lines.push('', '## Nuxt v3 Documentation', '')

  for (const doc of docsV3) {
    const desc = doc.description ? ` — ${doc.description}` : ''
    lines.push(`- [${doc.title}](${doc.path})${desc}`)
  }

  lines.push('', '## Deployment Guides', '')

  for (const doc of deploy) {
    const desc = doc.description ? ` — ${doc.description}` : ''
    lines.push(`- [${doc.title}](${doc.path})${desc}`)
  }

  lines.push('', '## Blog', '')

  for (const post of blog) {
    const desc = post.description ? ` — ${post.description}` : ''
    lines.push(`- [${post.title}](${post.path})${desc}`)
  }

  lines.push('', '## Other Pages', '')
  lines.push('- [Modules](/modules) — Nuxt module ecosystem')
  lines.push('- [Changelog](/changelog) — Latest releases')
  lines.push('- [Templates](/templates) — Starter templates')
  lines.push('- [Showcase](/showcase) — Sites built with Nuxt')
  lines.push('- [Enterprise](/enterprise/agencies) — Enterprise support and agencies')
  lines.push('- [Team](/team) — Nuxt core team')
  lines.push('')

  setResponseHeader(event, 'Content-Type', 'text/markdown; charset=utf-8')
  return lines.join('\n')
}, {
  name: 'sitemap-md',
  swr: true,
  maxAge: 60 * 60
})
