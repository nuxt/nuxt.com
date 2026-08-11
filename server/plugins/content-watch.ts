export default defineNitroPlugin(async (nitroApp) => {
  if (!import.meta.dev) {
    return
  }

  const stop = await content.watch()
  nitroApp.hooks.hook('close', () => stop())
})
