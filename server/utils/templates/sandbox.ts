import { Sandbox } from '@vercel/sandbox'
import { and, desc, eq, lt, sql } from 'drizzle-orm'
import type { Template } from '#shared/types'
import { SERVE_SCRIPT_PATH } from './static-server'

export const PREVIEW_PORT = 3000
/** Where `checkTemplatesWorkflow` copies each template before installing it. */
const WORKDIR = '/vercel/app'
const PREVIEW_TAGS = { app: 'nuxt-com', purpose: 'templates-preview' }
/** Bounds what anonymous previews can cost at once. Not a per-visitor limit: a visitor already has one preview at a time. */
const MAX_RUNNING_PREVIEWS = 50
const PREVIEW_TIMEOUT_MS = 10 * 60 * 1000

async function waitUntilServing(url: string, timeoutMs: number) {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    const response = await fetch(url, { redirect: 'manual', signal: AbortSignal.timeout(3000) }).catch(() => null)
    if (response && response.status < 500) return true
    await new Promise(resolve => setTimeout(resolve, 250))
  }
  return false
}

/** A visitor has one preview at a time: starting one stops the others, and frees the slot of each one that stopped. */
async function stopPreviews(owner: string) {
  const sandboxes = await (await Sandbox.list({ tags: { owner }, limit: 20 })).toArray()
  await Promise.all(sandboxes
    .filter(sandbox => sandbox.tags?.purpose === PREVIEW_TAGS.purpose && sandbox.status === 'running')
    .map(sandbox => Sandbox.get({ name: sandbox.name }).then(running => stopPreview(owner, running)).catch(() => {})))
}

/**
 * Takes a preview slot for the sandbox `id`. A single statement, so parallel starts can't take more than `MAX_RUNNING_PREVIEWS`:
 * each start holds its own slot, including several from one visitor, until its sandbox stops.
 * The slot lasts as long as the sandbox can run, plus the time to create it.
 */
async function reservePreview(owner: string, id: string) {
  const reservedAt = Date.now()
  const now = Math.floor(reservedAt / 1000)
  const expiresAt = now + PREVIEW_TIMEOUT_MS / 1000 + 60
  await db.delete(schema.templatePreviews).where(lt(schema.templatePreviews.expiresAt, new Date()))
  const reserved = await db.all(sql`
    INSERT INTO template_previews (id, owner, reserved_at, expires_at)
    SELECT ${id}, ${owner}, ${reservedAt}, ${expiresAt}
    WHERE (SELECT count(*) FROM template_previews WHERE expires_at > ${now}) < ${MAX_RUNNING_PREVIEWS}
    RETURNING id`)
  return reserved.length > 0
}

/** Whether `id` is the visitor's latest start, the one preview it keeps. */
async function holdsPreview(owner: string, id: string) {
  const [row] = await db.select({ id: schema.templatePreviews.id }).from(schema.templatePreviews)
    .where(eq(schema.templatePreviews.owner, owner))
    .orderBy(desc(schema.templatePreviews.reservedAt), desc(schema.templatePreviews.id))
    .limit(1)
  return row?.id === id
}

export async function releasePreview(owner: string, id: string) {
  await db.delete(schema.templatePreviews).where(and(eq(schema.templatePreviews.owner, owner), eq(schema.templatePreviews.id, id)))
}

/**
 * Restores the snapshot of a template's last passing check and starts its production server. Resolves once it answers, in about 3s.
 * The sandbox stops after 10 minutes, or once its owner starts another preview.
 */
export async function startPreview(template: Template, owner: string) {
  const snapshotId = await getPassingSnapshotId(template.slug)
  if (!snapshotId) {
    throw createError({ statusCode: 409, message: 'This template has no live preview right now.' })
  }

  const name = `templates-preview-${template.slug}-${crypto.randomUUID().slice(0, 8)}`
  if (!await reservePreview(owner, name)) {
    throw createError({ statusCode: 503, message: 'Live previews are busy right now. Try again in a few minutes.' })
  }
  let sandbox: Sandbox
  try {
    await stopPreviews(owner)
    sandbox = await Sandbox.create({
      name,
      source: { type: 'snapshot', snapshotId },
      ports: [PREVIEW_PORT],
      timeout: PREVIEW_TIMEOUT_MS,
      persistent: false,
      tags: { ...PREVIEW_TAGS, template: template.slug, owner }
    })
  } catch (error) {
    await releasePreview(owner, name)
    throw error
  }
  try {
    // Another start from the same visitor came after this one while this sandbox was created, and its `stopPreviews` may have run too early to see it.
    if (!await holdsPreview(owner, name)) {
      throw createError({ statusCode: 409, message: 'Another preview started in this browser.' })
    }
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
    return { id: sandbox.name, url }
  } catch (error) {
    await stopPreview(owner, sandbox)
    throw error
  }
}

/** Stops a preview's sandbox, then frees its slot. A sandbox that fails to stop keeps its slot until it expires, so it still counts toward `MAX_RUNNING_PREVIEWS`. */
export async function stopPreview(owner: string, sandbox: Sandbox) {
  try {
    await sandbox.stop()
  } catch (error) {
    console.error('[templates] preview stop failed', error)
    return
  }
  await releasePreview(owner, sandbox.name)
}

export async function getPreviewSandbox(id: string, owner: string) {
  const sandbox = await Sandbox.get({ name: id }).catch(() => null)
  if (!sandbox || sandbox.tags?.purpose !== PREVIEW_TAGS.purpose || sandbox.tags?.owner !== owner) return null
  return sandbox
}
