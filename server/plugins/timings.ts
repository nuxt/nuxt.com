import { logger } from 'nuxt/kit'

declare module 'h3' {
  interface H3EventContext {
    nuxtTimings: {
      start: number
    }
  }
}

export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('request', (event) => {
    event.context.nuxtTimings = {
      start: performance.now(),
    }
  })

  nitroApp.hooks.hook('afterResponse', async (event) => {
    const pathPattern = event.context.matchedRoute?.path || '/**'
    const responseStatus = getResponseStatus(event)
    const duration = performance.now() - event.context.nuxtTimings.start
    const log = {
      timestamp: new Date().toUTCString(),
      method: event.method,
      path: event.path === pathPattern ? event.path : `${event.path} (${pathPattern})`,
      status: responseStatus,
      duration: Math.round(duration*1000)/1000,
      cached: responseStatus === 304,
    }
    const SERVER_TIMINGS: any = process.env.SERVER_TIMINGS
    if (SERVER_TIMINGS?.writeDataPoint) {
      // event.waitUntil(async () => {
        await SERVER_TIMINGS.writeDataPoint({
          blobs: [event.path, pathPattern, event.method],
          doubles: [duration, responseStatus],
        })
      // })
    } else {
      logger.info(`${log.cached ? '`[CACHED] `' : ' '}${event.method} ${event.path} ${log.status} ${log.duration}ms`)
    }
  })

  nitroApp.hooks.hook('error', async (error, ctx) => {
    if ((error as any).statusCode === 401) return
    // Prepare
    const date = new Date()
    const tags = ['error', ...(ctx.tags as string[] || []).sort()]
    const path = ctx.event?.path || '?'
    const method = ctx.event?.method || '?'

    // Show on console
    console.error(
      tags.map((tag) => `[${tag}]`).join(' '),
      `[${method} ${path}]`,
      date.toISOString(),
      error
    )

    // Keep in storage
    // const storage = useStorage()
    // const id = date.toISOString().toLowerCase().replace(/t|z|:|\./g,'-').replace(/-$/,'')
    // await storage.setItem('logs:' + id, {
    //   id,
    //   date,
    //   method,
    //   path,
    //   message: error.message,
    //   stack: error.stack,
    // })
  })
});
