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
