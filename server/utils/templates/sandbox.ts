import { Sandbox } from '@vercel/sandbox'
import type { PreviewEvent, PreviewStep, Template } from '#shared/types'
import { SERVE_SCRIPT_PATH } from './static-server'

declare module 'nitropack/types' {
  interface NitroRuntimeHooks {
    /** Runs once a live preview serves, while its stream is still open: a Nitro plugin can keep working on the sandbox and `send` more events. */
    'templates:preview': (context: { template: Template, owner: string, sandbox: Sandbox, send: (event: PreviewEvent) => void }) => Promise<void> | void
  }
}

export const PREVIEW_PORT = 3000
/** Where `checkTemplatesWorkflow` copies each template before installing it. */
const WORKDIR = '/vercel/app'
const PREVIEW_TAGS = { app: 'nuxt-com', purpose: 'templates-preview' }
/** Bounds what anonymous previews can cost at once. Not a per-visitor limit: a visitor already has one preview at a time. */
const MAX_RUNNING_PREVIEWS = 50

async function waitUntilServing(url: string, timeoutMs: number) {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    const response = await fetch(url, { redirect: 'manual', signal: AbortSignal.timeout(3000) }).catch(() => null)
    if (response && response.status < 500) return true
    await new Promise(resolve => setTimeout(resolve, 250))
  }
  return false
}

/** A visitor has one preview at a time: starting one stops the others. */
async function stopPreviews(owner: string) {
  const sandboxes = await (await Sandbox.list({ tags: { owner }, limit: 20 })).toArray()
  await Promise.all(sandboxes
    .filter(sandbox => sandbox.tags?.purpose === PREVIEW_TAGS.purpose && sandbox.status === 'running')
    .map(sandbox => Sandbox.get({ name: sandbox.name }).then(running => running.stop()).catch(() => {})))
}

/** Previews run for at most 10 minutes, so the running ones are always among the newest. */
async function countRunningPreviews() {
  const { sandboxes } = await Sandbox.list({ tags: { purpose: PREVIEW_TAGS.purpose }, limit: 100, sortBy: 'createdAt', sortOrder: 'desc' })
  return sandboxes.filter(sandbox => sandbox.status === 'running' || sandbox.status === 'pending').length
}

/**
 * Restores the snapshot of a template's last passing check and starts its production server. Resolves once it answers, in about 3s.
 * The sandbox stops after 10 minutes, or once its owner starts another preview.
 */
export async function startPreview(template: Template, owner: string, onStep?: (step: PreviewStep) => void) {
  const snapshotId = await getPassingSnapshotId(template.slug)
  if (!snapshotId) {
    throw createError({ statusCode: 409, message: 'This template has no live preview right now.' })
  }

  await stopPreviews(owner)
  if (await countRunningPreviews() >= MAX_RUNNING_PREVIEWS) {
    throw createError({ statusCode: 503, message: 'Live previews are busy right now. Try again in a few minutes.' })
  }
  const sandbox = await Sandbox.create({
    name: `templates-preview-${template.slug}-${crypto.randomUUID().slice(0, 8)}`,
    source: { type: 'snapshot', snapshotId },
    ports: [PREVIEW_PORT],
    timeout: PREVIEW_TIMEOUT_MS,
    persistent: false,
    tags: { ...PREVIEW_TAGS, template: template.slug, owner }
  })
  onStep?.('restored')
  try {
    await sandbox.runCommand({
      cmd: 'bash',
      args: ['-c', `export PORT=${PREVIEW_PORT} HOST=0.0.0.0; exec bash ${SERVE_SCRIPT_PATH}`],
      cwd: WORKDIR,
      detached: true
    })
    const url = sandbox.domain(PREVIEW_PORT)
    if (!await waitUntilServing(url, 20_000)) {
      throw createError({ statusCode: 504, message: 'The preview server did not start.' })
    }
    onStep?.('serving')
    return { id: sandbox.name, url, sandbox }
  } catch (error) {
    await sandbox.stop().catch(() => {})
    throw error
  }
}

export async function getPreviewSandbox(id: string, owner: string) {
  const sandbox = await Sandbox.get({ name: id }).catch(() => null)
  if (!sandbox || sandbox.tags?.purpose !== PREVIEW_TAGS.purpose || sandbox.tags?.owner !== owner) return null
  return sandbox
}
