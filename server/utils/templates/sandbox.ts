import { Sandbox } from '@vercel/sandbox'
import type { Template } from '#shared/types'
import { SERVE_SCRIPT_PATH } from './static-server'

export const PREVIEW_PORT = 3000
/** Where `checkTemplatesWorkflow` copies each template before installing it. */
const WORKDIR = '/vercel/app'
const PREVIEW_TAGS = { app: 'nuxt-com', purpose: 'templates-preview' }

async function waitUntilServing(url: string, timeoutMs: number) {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    const response = await fetch(url, { redirect: 'manual', signal: AbortSignal.timeout(3000) }).catch(() => null)
    if (response && response.status < 500) return true
    await new Promise(resolve => setTimeout(resolve, 250))
  }
  return false
}

/** Restores the snapshot of a template's last passing check and starts its production server. Resolves once it answers, in about 3s. */
export async function startPreview(template: Template) {
  const snapshotId = await getPassingSnapshotId(template.slug)
  if (!snapshotId) {
    throw createError({ statusCode: 409, message: 'This template has no live preview right now.' })
  }

  const sandbox = await Sandbox.create({
    source: { type: 'snapshot', snapshotId },
    ports: [PREVIEW_PORT],
    timeout: 10 * 60 * 1000,
    persistent: false,
    tags: { ...PREVIEW_TAGS, template: template.slug }
  })
  await sandbox.runCommand({
    cmd: 'bash',
    args: ['-c', `export PORT=${PREVIEW_PORT} HOST=0.0.0.0; exec bash ${SERVE_SCRIPT_PATH}`],
    cwd: WORKDIR,
    detached: true
  })

  const url = sandbox.domain(PREVIEW_PORT)
  if (!await waitUntilServing(url, 20_000)) {
    await sandbox.stop().catch(() => {})
    throw createError({ statusCode: 504, message: 'The preview server did not start.' })
  }
  return { id: sandbox.name, url }
}

export async function getPreviewSandbox(id: string) {
  const sandbox = await Sandbox.get({ name: id }).catch(() => null)
  if (!sandbox || sandbox.tags?.purpose !== PREVIEW_TAGS.purpose) return null
  return sandbox
}
