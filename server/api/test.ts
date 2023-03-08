export default eventHandler(async (event) => {
  const module = await fetchModuleReadme({ name: 'icon', repo: 'nuxt-modules/icon' })

  return module
})