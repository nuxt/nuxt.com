import { addAbortSignal, Readable } from 'node:stream'
import { PROJECT_ARCHIVE_SCRIPT } from '../../../../utils/templates/archive'
import { TEMPLATE_WORKDIR } from '../../../../utils/templates/check-scripts'

export default defineEventHandler(async (event) => {
  const owner = await getRateLimitPrincipalId(event)
  const sandbox = owner ? await getPreviewSandbox(getRouterParam(event, 'id')!, owner) : null
  if (sandbox?.status !== 'running') {
    throw createError({ statusCode: 404, message: 'This preview has stopped.' })
  }

  const path = `/tmp/nuxt-project-${crypto.randomUUID()}.zip`
  const controller = new AbortController()
  let readTimer: ReturnType<typeof setTimeout> | undefined
  // Read before an edit can land behind the ZIP. Unused when zipping fails, so its failure must not go unhandled.
  const changes = previewChanges(sandbox)
  changes.catch(() => {})
  try {
    const result = await sandbox.runCommand({
      cmd: 'python3', args: ['-c', PROJECT_ARCHIVE_SCRIPT, path], cwd: TEMPLATE_WORKDIR,
      signal: AbortSignal.timeout(30_000)
    })
    if (result.exitCode !== 0) {
      throw createError({ statusCode: 500, message: 'The project could not be zipped. Please try again.' })
    }
    const startReadTimer = () => setTimeout(() => controller.abort(), 30_000)
    readTimer = startReadTimer()
    const stream = await sandbox.readFile({ path }, { signal: controller.signal })
    if (!stream) throw createError({ statusCode: 500, message: 'The project ZIP could not be read.' })
    const input = addAbortSignal(controller.signal, stream instanceof Readable ? stream : new Readable().wrap(stream))
    setResponseHeaders(event, {
      'content-type': 'application/zip',
      'content-disposition': 'attachment; filename="nuxt-project.zip"',
      'cache-control': 'no-store'
    })
    const sent = await sendStream(event, Readable.from((async function* () {
      for await (const chunk of input) {
        clearTimeout(readTimer)
        yield chunk
        readTimer = startReadTimer()
      }
    })()))
    // Once per preview and only once the ZIP was sent, so a failed download leaves the step to its retry.
    // `changes` is the depth this ZIP was made at, read alongside it.
    trackTemplateEvent(event, 'Template Downloaded', claimPreviewStep(sandbox, 'download').then(async first => first ? { template: sandbox.tags?.template, changes: await changes } : null))
    return sent
  } finally {
    clearTimeout(readTimer)
    controller.abort()
    await sandbox.runCommand({ cmd: 'rm', args: ['-f', path], signal: AbortSignal.timeout(10_000) }).catch(error => console.error('[templates] ZIP cleanup failed', error))
  }
})
