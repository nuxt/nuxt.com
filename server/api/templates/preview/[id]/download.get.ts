import { Readable } from 'node:stream'
import { PROJECT_ARCHIVE_SCRIPT } from '../../../../utils/templates/archive'
import { TEMPLATE_WORKDIR } from '../../../../utils/templates/check-scripts'

export default defineEventHandler(async (event) => {
  const owner = await getRateLimitPrincipalId(event)
  const sandbox = owner ? await getPreviewSandbox(getRouterParam(event, 'id')!, owner) : null
  if (sandbox?.status !== 'running') {
    throw createError({ statusCode: 404, message: 'This preview has stopped.' })
  }

  const path = `/tmp/nuxt-project-${crypto.randomUUID()}.zip`
  try {
    const result = await sandbox.runCommand({
      cmd: 'python3', args: ['-c', PROJECT_ARCHIVE_SCRIPT, path], cwd: TEMPLATE_WORKDIR,
      signal: AbortSignal.timeout(30_000)
    })
    if (result.exitCode !== 0) {
      throw createError({ statusCode: 500, message: 'The project could not be zipped. Please try again.' })
    }
    const stream = await sandbox.readFile({ path })
    if (!stream) throw createError({ statusCode: 500, message: 'The project ZIP could not be read.' })
    setResponseHeaders(event, {
      'content-type': 'application/zip',
      'content-disposition': 'attachment; filename="nuxt-project.zip"',
      'cache-control': 'no-store'
    })
    return await sendStream(event, new Readable().wrap(stream))
  } finally {
    await sandbox.runCommand({ cmd: 'rm', args: ['-f', path] }).catch(error => console.error('[templates] ZIP cleanup failed', error))
  }
})
