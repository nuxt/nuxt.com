export default eventHandler(async (event) => {
  const module = await fetchModuleReadme({ name: 'ui', npm: '@nuxt/ui' }, true)

  return module
})