import { queryCollection } from '@nuxt/content/server'

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
  { title: 'Design System', path: '/design.md' },
  { title: 'Video Courses', path: '/video-courses' }
]

export default defineEventHandler(async (event) => {
  const domain = getSiteUrl(event)
  // Mirrors /sitemap.xml: v3 (legacy) and v5 (nightly) are excluded — v5 is
  // also disallowed in /robots.txt until Nuxt 5 ships.
  const [docsv4, blog, deploy] = await Promise.all([
    queryCollection(event, 'docsv4')
      .where('extension', '=', 'md')
      .select('path', 'title')
      .all(),
    queryCollection(event, 'blog')
      .where('draft', '=', 0)
      .select('path', 'title', 'date')
      .all(),
    queryCollection(event, 'deploy')
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

  lines.push('', '## Documentation', '')
  for (const doc of docsv4) lines.push(`- [${doc.title}](${domain}${doc.path}.md)`)

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
