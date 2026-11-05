import type { NotableRelease } from '#shared/types'

/** Repositories whose releases make up the changelog, with the product name blog posts use. */
export const CHANGELOG_PRODUCTS: Record<string, string> = {
  'nuxt/nuxt': 'Nuxt',
  'nuxt/image': 'Nuxt Image',
  'nuxt/fonts': 'Nuxt Fonts',
  'nuxt/ui': 'Nuxt UI',
  'nuxt/content': 'Nuxt Content',
  'nuxt/devtools': 'Nuxt DevTools',
  'nuxt/test-utils': 'Nuxt Test Utils',
  'nuxt/scripts': 'Nuxt Scripts',
  'nuxt/eslint': 'Nuxt ESLint',
  'nuxt/icon': 'Nuxt Icon',
  'nuxt/hints': 'Nuxt Hints'
}

export const CHANGELOG_REPOS = Object.keys(CHANGELOG_PRODUCTS)

export interface GitHubRelease {
  tag_name: string
  name: string | null
  draft: boolean
  published_at: string | null
  html_url: string
  body: string | null
}

export interface RawRelease {
  repo: string
  tag: string
  title: string
  date: string
  url: string
  markdown: string
}

export const fetchRawReleases = cachedFunction(async (): Promise<RawRelease[]> => {
  const results = await Promise.allSettled(
    CHANGELOG_REPOS.map(async (repo) => {
      const releases = await $fetch<GitHubRelease[]>(`https://api.github.com/repos/${repo}/releases`, {
        headers: githubHeaders()
      })
      return releases
        .filter(r => !r.draft && r.published_at)
        .map(r => ({
          repo,
          tag: r.tag_name,
          title: r.name || r.tag_name,
          date: r.published_at!,
          url: r.html_url,
          markdown: r.body || ''
        }))
    })
  )

  results.forEach((r, i) => {
    if (r.status === 'rejected') {
      console.error(`Cannot fetch releases for ${CHANGELOG_REPOS[i]}: ${r.reason}`)
    }
  })

  return results
    .filter((r): r is PromiseFulfilledResult<RawRelease[]> => r.status === 'fulfilled')
    .flatMap(r => r.value)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}, {
  name: 'raw-releases',
  swr: true,
  maxAge: 60 * 60
})

/** GitHub's default page size, so the number of releases fetched per repository. */
const GITHUB_PAGE_SIZE = 30

function plainText(text: string) {
  return text
    .replace(/&nbsp;/g, ' ')
    .replace(/:[\w+-]+:/g, '')
    .replace(/[`*_]/g, '')
    .replace(/\p{Extended_Pictographic}/gu, '')
    .replace(/\u200D/g, '')
    .replace(/\uFE0F/g, '')
    .trim()
}

/** Sub-headings of the release notes' Highlights section, e.g. "Splitter component" in Nuxt UI 4.11. */
function releaseHighlights(markdown: string) {
  const items: string[] = []
  let level = 0
  for (const line of markdown.split(/\r?\n/)) {
    const heading = line.match(/^(#{1,4}) (.+)$/)
    if (!heading) continue
    const depth = heading[1]!.length
    const text = plainText(heading[2]!)
    if (level && depth > level) items.push(text)
    else level = /highlight/i.test(text) ? depth : 0
  }
  return items
}

/** Major and minor releases, newest first, without patches or prereleases. */
export const fetchNotableReleases = cachedFunction(async (): Promise<NotableRelease[]> => {
  const releases = await fetchRawReleases() ?? []

  // Only the latest page of releases is fetched per repository. Stop where the busiest repository's
  // page ends, so the list never skips releases of a repository it still shows newer ones of.
  const oldestPerRepo = new Map<string, { date: string, count: number }>()
  for (const release of releases) {
    const entry = oldestPerRepo.get(release.repo)
    oldestPerRepo.set(release.repo, { date: release.date, count: (entry?.count ?? 0) + 1 })
  }
  const since = [...oldestPerRepo.values()]
    .filter(entry => entry.count >= GITHUB_PAGE_SIZE)
    .map(entry => entry.date)
    .sort()
    .at(-1)

  return releases.flatMap((release): NotableRelease[] => {
    const product = CHANGELOG_PRODUCTS[release.repo]
    const version = release.tag.match(/(\d+)\.(\d+)\.(\d+)(-[\w.]+)?/)
    if (!product || !version || version[3] !== '0' || version[4] || (since && release.date < since)) return []
    return [{
      url: release.url,
      repo: release.repo,
      product,
      version: `${version[1]}.${version[2]}.0`,
      date: release.date,
      kind: version[2] === '0' ? 'major' : 'minor',
      highlights: releaseHighlights(release.markdown)
    }]
  })
}, {
  name: 'notable-releases',
  swr: true,
  maxAge: 60 * 60
})
