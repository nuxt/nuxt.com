import type { BlogArticle } from '#shared/types'
import { getAgentSiteUrl } from '#agent-discovery'

function isoDate(date: string | Date) {
  return new Date(date).toISOString().split('T')[0]!
}

export default defineCachedEventHandler(async (event) => {
  const domain = getAgentSiteUrl(event)
  const [releases = [], posts] = await Promise.all([
    fetchNotableReleases(),
    listByDir<BlogArticle>('/blog')
  ])

  const lines: string[] = [
    '# Nuxt Updates',
    '',
    '> What\'s shipping across Nuxt and its official modules: notable releases and blog posts.',
    '',
    '## Releases',
    '',
    `Major and minor releases. Every release, patches included, is in the [changelog](${domain}/raw/changelog.md).`,
    ''
  ]

  for (const release of releases.slice(0, 20)) {
    const highlights = release.highlights.length ? `: ${release.highlights.join(', ')}` : ''
    lines.push(`- [${release.product} ${release.version}](${release.url}) (${isoDate(release.date)})${highlights}`)
  }

  lines.push('', '## Blog Posts', '')
  for (const post of posts.filter(post => post.extension === '.md').sort((a, b) => isoDate(b.date).localeCompare(isoDate(a.date)))) {
    const meta = [post.category, isoDate(post.date)].filter(Boolean).join(', ')
    lines.push(`- [${post.title}](${domain}/raw${post.path}.md) (${meta}): ${post.description}`)
  }

  setResponseHeader(event, 'Content-Type', 'text/markdown; charset=utf-8')
  setResponseHeader(event, 'Link', [
    `<${domain}/updates>; rel="canonical"`,
    `<${domain}/updates>; rel="alternate"; type="text/html"`
  ].join(', '))
  return lines.join('\n')
}, {
  name: 'raw-updates-md',
  swr: true,
  maxAge: 60 * 60
})
