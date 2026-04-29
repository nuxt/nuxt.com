import type { H3Event } from 'h3'
import type { Collections, CollectionQueryBuilder } from '@nuxt/content'
import { queryCollection } from '@nuxt/content/server'

type queryCollectionWithEvent = <T extends keyof Collections>(event: H3Event, collection: T) => CollectionQueryBuilder<Collections[T]>

const STATIC_LINKS = [
  { title: 'Home', path: '/' },
  { title: 'Documentation', path: '/docs' },
  { title: 'Modules', path: '/modules' },
  { title: 'Templates', path: '/templates' },
  { title: 'Showcase', path: '/showcase' },
  { title: 'Deploy', path: '/deploy' },
  { title: 'Changelog', path: '/changelog' },
  { title: 'Blog', path: '/blog' },
  { title: 'Team', path: '/team' },
  { title: 'Newsletter', path: '/newsletter' },
  { title: 'Design Kit', path: '/design-kit' },
  { title: 'Video Courses', path: '/video-courses' }
]

export default defineEventHandler(async (event: H3Event) => {
  const domain = getSiteConfig(event).url
  // v5 (nightly) is intentionally excluded — it is also disallowed in
  // /robots.txt and /sitemap.xml until Nuxt 5 ships.
  const [docsv4, docsv3, blog, deploy] = await Promise.all([
    (queryCollection as queryCollectionWithEvent)(event, 'docsv4')
      .where('extension', '=', 'md')
      .select('path', 'title')
      .all(),
    (queryCollection as queryCollectionWithEvent)(event, 'docsv3')
      .where('extension', '=', 'md')
      .select('path', 'title')
      .all(),
    (queryCollection as queryCollectionWithEvent)(event, 'blog')
      .where('draft', '=', 0)
      .select('path', 'title', 'date')
      .all(),
    (queryCollection as queryCollectionWithEvent)(event, 'deploy')
      .select('path', 'title')
      .all()
  ])

  const lines: string[] = [
    '# Nuxt Sitemap',
    '',
    '> Markdown index of every page on nuxt.com. Append `.md` to any docs/blog/deploy URL (or set `Accept: text/markdown`) to retrieve the markdown source.',
    '',
    '## Pages',
    ''
  ]
  for (const link of STATIC_LINKS) {
    lines.push(`- [${link.title}](${domain}${link.path})`)
  }

  lines.push('', '## Documentation (v4 — current stable)', '')
  for (const doc of docsv4) lines.push(`- [${doc.title}](${domain}${doc.path}.md)`)

  lines.push('', '## Documentation (v3 — legacy)', '')
  for (const doc of docsv3) lines.push(`- [${doc.title}](${domain}${doc.path}.md)`)

  lines.push('', '## Deploy providers', '')
  for (const provider of deploy) lines.push(`- [${provider.title}](${domain}${provider.path}.md)`)

  lines.push('', '## Blog', '')
  for (const post of (blog as Array<{ path: string, title: string, date?: string }>)) {
    const date = post.date ? ` _(${post.date})_` : ''
    lines.push(`- [${post.title}](${domain}${post.path}.md)${date}`)
  }

  setResponseHeader(event, 'Content-Type', 'text/markdown; charset=utf-8')
  return lines.join('\n') + '\n'
})
