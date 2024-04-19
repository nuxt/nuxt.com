export default eventHandler(async (event) => {
  const module = await fetchModuleReadme(event, { name: 'ui', npm: '@nuxt/ui' }, true)

  return module
})
