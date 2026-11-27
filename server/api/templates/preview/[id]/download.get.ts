import { addAbortSignal, Readable } from 'node:stream'
import { PROJECT_ARCHIVE_SCRIPT } from '../../../../utils/templates/archive'
import { TEMPLATE_WORKDIR } from '../../../../utils/templates/check-scripts'
import { createError, defineHandler, getRouterParam } from 'nuxt/server'

export default defineHandler(async (event) => {
  const owner = await getRateLimitPrincipalId(event)
  const sandbox = owner ? await getPreviewSandbox(getRouterParam(event, 'id', { decode: true })!, owner) : null
  if (sandbox?.status !== 'running') {
    throw createError({ status: 404, message: 'This preview has stopped.' })
  }

  const path = `/tmp/nuxt-project-${crypto.randomUUID()}.zip`
  const controller = new AbortController()
  let readTimer: ReturnType<typeof setTimeout> | undefined
  // Read before an edit can land behind the ZIP. Unused when zipping fails, so its failure must not go unhandled.
  const changes = previewChanges(sandbox)
  changes.catch(() => {})
  let cleaned: Promise<void> | undefined
  // Once, whichever of the handler, the stream's end or a disconnect gets there first.
  const cleanup = () => cleaned ??= (async () => {
    clearTimeout(readTimer)
    controller.abort()
    await sandbox.runCommand({ cmd: 'rm', args: ['-f', path], signal: AbortSignal.timeout(10_000) }).catch(error => console.error('[templates] ZIP cleanup failed', error))
  })()
  // Once the ZIP streams, the stream cleans up when it ends; until then, this handler does.
  let streaming = false
  try {
    const result = await sandbox.runCommand({
      cmd: 'python3', args: ['-c', PROJECT_ARCHIVE_SCRIPT, path], cwd: TEMPLATE_WORKDIR,
      signal: AbortSignal.timeout(30_000)
    })
    if (result.exitCode !== 0) {
      throw createError({ status: 500, message: 'The project could not be zipped. Please try again.' })
    }
    const startReadTimer = () => setTimeout(() => controller.abort(), 30_000)
    readTimer = startReadTimer()
    const stream = await sandbox.readFile({ path }, { signal: controller.signal })
    if (!stream) throw createError({ status: 500, message: 'The project ZIP could not be read.' })
    const input = addAbortSignal(controller.signal, stream instanceof Readable ? stream : new Readable().wrap(stream))
    event.res.headers.set('content-type', 'application/zip')
    event.res.headers.set('content-disposition', 'attachment; filename="nuxt-project.zip"')
    event.res.headers.set('cache-control', 'no-store')
    streaming = true
    const chunks = (async function* () {
      try {
        for await (const chunk of input) {
          clearTimeout(readTimer)
          yield chunk
          readTimer = startReadTimer()
        }
        // Once per preview and only once the ZIP was sent, so a failed download leaves the step to its retry.
        // `changes` is the depth this ZIP was made at, read alongside it.
        trackTemplateEvent(event, 'Template Downloaded', claimPreviewStep(sandbox, 'download').then(async first => first ? { template: sandbox.tags?.template, changes: await changes } : null))
      } finally {
        await cleanup()
      }
    })()
    // A Node stream, which h3 pipes with backpressure: it writes a web stream without waiting for a slow visitor.
    const body = Readable.from(chunks)
    // h3 never cancels the body when a visitor disconnects, but the request signal aborts. Clean up here too: a loop
    // that never started has no `finally` to run, and one waiting on the sandbox stops once the read aborts.
    event.req.signal.addEventListener('abort', () => {
      body.destroy()
      void cleanup()
    }, { once: true })
    return body
  } finally {
    if (!streaming) await cleanup()
  }
})
