const firstLevels = ['getting-started', 'guide', 'api', 'examples', 'community']

console.log(('Nitro plugin'))

export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('content:file:beforeParse', (file) => {
    console.log('content:file:beforeParse', file._id)
    if (file._id.endsWith('.md')) {
      firstLevels.forEach((level) => {
        file.body = file.body.replaceAll(`(/${level}/`, `(/docs/${level}/`)
        file.body = file.body.replaceAll(`"/${level}/`, `"/docs/${level}/`)
      })
    }
  })
})
