export const CHANGELOG_REPOS = [
  'nuxt/nuxt',
  'nuxt/image',
  'nuxt/fonts',
  'nuxt/ui',
  'nuxt/content',
  'nuxt/devtools',
  'nuxt/test-utils',
  'nuxt/scripts',
  'nuxt/eslint',
  'nuxt/icon',
  'nuxt/hints'
]

export interface UnghRelease {
  tag: string
  name: string
  draft: boolean
  publishedAt: string
  markdown: string
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
      const { releases } = await $fetch<{ releases: UnghRelease[] }>(`https://ungh.cc/repos/${repo}/releases`)
      return releases
        .filter(r => !r.draft)
        .map(r => ({
          repo,
          tag: r.tag,
          title: r.name || r.tag,
          date: r.publishedAt,
          url: `https://github.com/${repo}/releases/tag/${r.tag}`,
          markdown: r.markdown
        }))
    })
  )

  return results
    .filter((r): r is PromiseFulfilledResult<RawRelease[]> => r.status === 'fulfilled')
    .flatMap(r => r.value)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}, {
  name: 'raw-releases',
  swr: true,
  maxAge: 60 * 60
})
