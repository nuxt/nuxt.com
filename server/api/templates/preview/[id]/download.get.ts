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
    return await sendStream(event, Readable.from((async function* () {
      for await (const chunk of input) {
        clearTimeout(readTimer)
        yield chunk
        readTimer = startReadTimer()
      }
    })()))
  } finally {
    clearTimeout(readTimer)
    controller.abort()
    await sandbox.runCommand({ cmd: 'rm', args: ['-f', path], signal: AbortSignal.timeout(10_000) }).catch(error => console.error('[templates] ZIP cleanup failed', error))
  }
})
