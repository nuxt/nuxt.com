import { CURRENT_DOCS_VERSION } from '#shared/utils/docs'
import { cliInstanceKey, docsInstanceKey } from '#shared/utils/content'

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
  // Mirrors /sitemap.xml: v3 (legacy) and v5 (nightly) are excluded
  const [docsv4, cliv4, examples, blog, deploy] = await Promise.all([
    listInstancePages(docsInstanceKey(CURRENT_DOCS_VERSION)),
    listInstancePages(cliInstanceKey(CURRENT_DOCS_VERSION)),
    listInstancePages('examples'),
    listInstancePages('site', { dir: '/blog' }).then(items => items.filter(item => !item.data.draft)),
    listInstancePages('site', { dir: '/deploy' })
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
  for (const doc of [...docsv4, ...cliv4]) lines.push(`- [${doc.title}](${domain}${doc.path}.md)`)

  lines.push('', '## Examples', '')
  for (const example of examples) lines.push(`- [${example.title}](${domain}${example.path}.md)`)

  lines.push('', '## Deploy providers', '')
  for (const provider of deploy) lines.push(`- [${provider.title}](${domain}${provider.path}.md)`)

  lines.push('', '## Blog', '')
  for (const post of blog) {
    const date = post.data.date ? ` _(${post.data.date})_` : ''
    lines.push(`- [${post.title}](${domain}${post.path}.md)${date}`)
  }

  setResponseHeader(event, 'Content-Type', 'text/markdown; charset=utf-8')
  return lines.join('\n') + '\n'
})
