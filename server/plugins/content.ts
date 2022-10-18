const firstLevels = ['getting-started', 'guide', 'api', 'examples', 'community']

export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('content:file:beforeParse', (file) => {
    if (file._id.endsWith('.md')) {
      firstLevels.forEach((level) => {
        file.body = file.body.replaceAll(`(/${level}/`, `(/docs/${level}/`)
        file.body = file.body.replaceAll(`"/${level}/`, `"/docs/${level}/`)
      })
    }
  })
})
