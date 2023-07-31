import type { Module } from '../../../types'

export default defineCachedEventHandler(async () => {
  const _modules = await $fetch<Module[]>('https://cdn.jsdelivr.net/npm/@nuxt/modules@latest/modules.json')
  const modules: Module[] = await Promise.all(_modules.map(fetchModuleStats)).then(modules => modules.map(assignTagsToModule))

  return {
    modules
  }
}, {
  name: 'modules',
  maxAge: 60 * 1000
})

async function fetchModuleStats (module: Module) {
  const ghRepo = module.repo.split('#')[0]
  const [owner, name] = ghRepo.split('/')
  const [npmInfos, npmStats, github, contributors] = await Promise.all([
    $fetch<any>(`https://registry.npmjs.org/${module.npm}`)
      .catch((err) => {
      // eslint-disable-next-line no-console
        console.error(`Cannot fetch npm info for ${module.npm}: ${err}`)
        return { }
      }),
    $fetch<any>(`https://api.npmjs.org/downloads/point/last-month/${module.npm}`)
      .catch((err) => {
        // eslint-disable-next-line no-console
        console.error(`Cannot fetch npm downloads stats for ${module.npm}: ${err}`)
        return { downloads: 0 }
      }),
    $fetch<any>(`https://ungh.cc/repos/${owner}/${name}`)
      .catch((err) => {
        // eslint-disable-next-line no-console
        console.error(`Cannot fetch github repo info for ${owner}/${name}: ${err}`)
        return { repo: { stars: 0 } }
      }).then(r => r.repo),
    $fetch<any>(`https://ungh.cc/repos/${owner}/${name}/contributors`)
      .catch((err) => {
        // eslint-disable-next-line no-console
        console.error(`Cannot fetch github contributors info for ${owner}/${name}: ${err}`)
        return { contributors: [] }
      }).then(r => r.contributors)
  ])
  module.downloads = npmStats.downloads
  module.stars = github.stars
  module.publishedAt = +new Date(npmInfos.publishedAt || undefined)
  module.createdAt = +new Date(npmInfos.createdAt || undefined)
  module.contributors = contributors
  return module
}

function assignTagsToModule (module: Module) {
  const compatibilityTags = []
  if (module.compatibility.nuxt.includes('^2.0.0')) {
    if (module.compatibility.requires.bridge !== true /* bridge: false or bridge: optional */) {
      compatibilityTags.push('2.x')
    }
    if (module.compatibility.requires.bridge) {
      compatibilityTags.push('2.x-bridge')
    }
  }
  if (module.compatibility.nuxt.includes('^3.0.0')) {
    compatibilityTags.push('3.x')
  }

  return {
    ...module,
    tags: [
      ...(module.tags || []),
      ...compatibilityTags
    ]
  }
}
