export default eventHandler(async (event) => {
  const module = await fetchModuleReadme({ name: 'icon', npm: 'nuxt-icon' }, true)

  return module
})