import type { Module } from '../../../types'
import { defineCachedEventHandler } from '#imports'

export default defineCachedEventHandler(async () => {
  const _modules = await $fetch('https://cdn.jsdelivr.net/npm/@nuxt/modules@latest/modules.json')
  const modules: Module[] = await Promise.all(_modules.map(module => fetchModuleStats(module)))

  return {
    modules
  }
}, {
  name: 'modules',
  maxAge: 60 * 1000
})

async function fetchModuleStats (module: ModuleInfo) {
  const ghRepo = module.repo.split('#')[0]
  const [npm, github, contributors] = await Promise.all([
    $fetch<any>(`https://api.nuxtjs.org/api/npm/package/${module.npm}`)
      .catch((err) => {
        console.error(`Cannot fetch npm info for ${module.npm}: ${err}`)
        return { downloads: { lastMonth: 0 } }
      }),
    $fetch<any>(`https://ungh.unjs.io/repos/${ghRepo}`)
      .catch((err) => {
        console.error(`Cannot fetch github repo info for ${ghRepo}: ${err}`)
        return { repo: { stars: 0 } }
      }).then(r => r.repo),
    $fetch<any>(`https://ungh.unjs.io/repos/${ghRepo}/contributors`)
      .catch((err) => {
        console.error(`Cannot fetch github contributors info for ${ghRepo}: ${err}`)
        return { contributors: [] }
      }).then(r => r.contributors)
  ])
  module.downloads = npm.downloads.lastMonth
  module.stars = github.stars
  module.publishedAt = +new Date(npm.publishedAt || undefined)
  module.createdAt = +new Date(npm.createdAt || undefined)
  module.contributors = contributors
  return module
}
