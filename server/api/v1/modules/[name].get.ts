import { z } from 'zod'
import type { Module } from '#shared/types'
import { hasModuleDocs } from '#shared/utils/module-docs'
import { resolveReadmeUrls } from '../../../utils/content/readme'

export default defineCachedEventHandler(async (event) => {
  const { name } = await getValidatedRouterParams(event, z.object({
    name: z.string()
  }).parse)

  const modules = await fetchModules(event)

  const module = modules?.find(module => module.name === name)
  if (!module) {
    throw createError({
      statusCode: 404,
      message: `Module ${name} not found`
    })
  }

  // Health served separately (/api/v1/modules/health), merged client-side —
  // keeps nuxt.care off this page's SSR path.
  // A module with hosted docs renders them instead of its README: skip it, it would ship in every docs page payload.
  const withReadme = !hasModuleDocs(module.name)
  const [stats, contributors, readme] = await Promise.all([
    fetchModuleStats(event, module),
    fetchModuleContributors(event, module),
    withReadme ? fetchModuleReadme(event, module) : undefined
  ])
  // Who has a Nuxter profile, to link there instead of GitHub. Not blocking: GitHub links on an error.
  const known = await nuxters.known({
    githubIds: contributors.map(contributor => contributor.id),
    usernames: module.maintainers?.flatMap(maintainer => maintainer.github ? [maintainer.github] : [])
  }).catch((error) => {
    console.error('Cannot load Nuxters for module', module.name, error)
    return { githubIds: new Set<number>(), usernames: new Set<string>() }
  })

  return {
    ...module,
    maintainers: module.maintainers?.map(maintainer => ({ ...maintainer, nuxter: !!maintainer.github && known.usernames.has(maintainer.github.toLowerCase()) })),
    generatedAt: new Date().toISOString(),
    contributors: contributors.map(contributor => ({ ...contributor, nuxter: known.githubIds.has(contributor.id) })),
    stats,
    readme: readme && resolveReadmeUrls(readme, module.repo, stats.defaultBranch)
  } satisfies Module
}, {
  // Bumped when the payload or key changes: `modules:v7` entries are keyed without `-` (`colormode` for `color-mode`).
  name: 'modules:v8',
  // Nitro strips non-word characters from the key: `sitemap.` would read the `sitemap` entry, and `colormode`
  // the `color-mode` one. Registry names are `[a-z0-9-]`: anything else skips the cache (and 404s), and `-` is kept as `_`.
  shouldBypassCache: event => !/^[a-z0-9-]+$/.test(event.context.params!.name!),
  getKey: event => event.context.params!.name!.replaceAll('-', '_'),
  swr: true,
  maxAge: 60 * 60 // 1 hour
})
