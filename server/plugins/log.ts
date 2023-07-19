export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('error', async (error, ctx) => {
    // Prepare
    const date = new Date()
    const tags = ['error', ...(ctx.tags as string[] || []).sort()]
    const path = ctx.event?.path || '?'
    const method = ctx.event?.node.req.method || '?'

    // Show on console
    console.error(
      tags.map((tag) => `[${tag}]`).join(' '),
      `[${method} ${path}]`,
      date.toISOString(),
      error
    )

    // Keep in storage
    const storage = useStorage()
    const id = date.toISOString().toLowerCase().replace(/t|z|:|\./g,'-').replace(/-$/,'')
    await storage.setItem('logs:' + id, {
      id,
      date,
      method,
      path,
      message: error.message,
      stack: error.stack,
    })
  })
})
