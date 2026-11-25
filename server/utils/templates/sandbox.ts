import { Sandbox } from '@vercel/sandbox'
import type { H3Event } from 'h3'
import { and, desc, eq, lt, sql } from 'drizzle-orm'
import type { PreviewEvent, PreviewStep, Template } from '#shared/types'
import { TEMPLATE_WORKDIR } from './check-scripts'
import { DEV_PORT } from './dev-server'
import { SERVE_SCRIPT_PATH } from './static-server'

declare module 'nitropack/types' {
  interface NitroRuntimeHooks {
    /** Runs once a live preview serves, while its stream is still open: a Nitro plugin can keep working on the sandbox and `send` more events. */
    'templates:preview': (context: { template: Template, owner: string, sandbox: Sandbox, send: (event: PreviewEvent) => void }) => Promise<void> | void
  }
}

export const PREVIEW_PORT = 3000
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
async function reservePreview(owner: string, id: string, timeoutMs: number) {
  const reservedAt = Date.now()
  const now = Math.floor(reservedAt / 1000)
  const expiresAt = now + timeoutMs / 1000 + 60
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
 * The sandbox stops after `timeoutMs` unless extended, or once its owner starts another preview.
 */
export async function startPreview(template: Template, owner: string, timeoutMs: number, onStep?: (step: PreviewStep) => void) {
  const snapshotId = await getPassingSnapshotId(template.slug)
  if (!snapshotId) {
    throw createError({ statusCode: 409, message: 'This template has no live preview right now.' })
  }

  const name = `templates-preview-${template.slug}-${crypto.randomUUID().slice(0, 8)}`
  if (!await reservePreview(owner, name, timeoutMs)) {
    throw createError({ statusCode: 503, message: 'Live previews are busy right now. Try again in a few minutes.' })
  }
  let sandbox: Sandbox
  try {
    await stopPreviews(owner)
    sandbox = await Sandbox.create({
      name,
      source: { type: 'snapshot', snapshotId },
      ports: [PREVIEW_PORT, DEV_PORT],
      timeout: timeoutMs,
      persistent: false,
      tags: { ...PREVIEW_TAGS, template: template.slug, owner }
    })
  } catch (error) {
    await releasePreview(owner, name)
    throw error
  }
  onStep?.('restored')
  try {
    // Another start from the same visitor came after this one while this sandbox was created, and its `stopPreviews` may have run too early to see it.
    if (!await holdsPreview(owner, name)) {
      throw createError({ statusCode: 409, message: 'Another preview started in this browser.' })
    }
    await sandbox.runCommand({
      cmd: 'bash',
      args: ['-c', `export PORT=${PREVIEW_PORT} HOST=0.0.0.0; exec bash ${SERVE_SCRIPT_PATH}`],
      cwd: TEMPLATE_WORKDIR,
      detached: true
    })
    const url = sandbox.domain(PREVIEW_PORT)
    if (!await waitUntilServing(url, 20_000)) {
      throw createError({ statusCode: 504, message: 'The preview server did not start.' })
    }
    onStep?.('serving')
    return { id: sandbox.name, url, expiresAt: previewExpiresAt(sandbox), sandbox }
  } catch (error) {
    await stopPreview(owner, sandbox)
    throw error
  }
}

/**
 * How long a visitor's preview runs at first, and at most with extensions: longer for an admin signed in on nuxt.com.
 * A failed admin check (GitHub down) only costs the admin the longer limits, never the preview.
 */
export async function getPreviewLimits(event: H3Event) {
  const { user } = await getUserSession(event)
  const admin = user?.role === 'admin' && await isAuthorizedAdmin(event, user.username).catch(() => false)
  return admin
    ? { timeoutMs: PREVIEW_ADMIN_TIMEOUT_MS, maxLifetimeMs: PREVIEW_ADMIN_MAX_LIFETIME_MS }
    : { timeoutMs: PREVIEW_TIMEOUT_MS, maxLifetimeMs: PREVIEW_MAX_LIFETIME_MS }
}

function previewExpiresAt(sandbox: Sandbox) {
  return sandbox.expiresAt?.getTime() ?? sandbox.createdAt.getTime() + (sandbox.timeout ?? PREVIEW_TIMEOUT_MS)
}

/**
 * Gives a running preview `PREVIEW_TIMEOUT_MS` more, up to `maxLifetimeMs` after it was created, and keeps its slot for as long.
 * Concurrent requests for one preview extend it once.
 * Returns when it now stops, and whether it can be extended again.
 */
export async function extendPreview(owner: string, sandbox: Sandbox, maxLifetimeMs: number) {
  const expiresAt = previewExpiresAt(sandbox)
  const limit = sandbox.createdAt.getTime() + maxLifetimeMs
  const duration = Math.min(PREVIEW_TIMEOUT_MS, limit - expiresAt)
  if (duration < 60_000) {
    throw createError({ statusCode: 409, message: 'This preview can\'t run any longer.' })
  }
  const extendedTo = expiresAt + duration
  // The slot is moved first, and only from the value read here: of concurrent requests, whatever limit each got, one moves it
  // and the others stop here, since `extendTimeout` adds to the running session.
  const slot = and(eq(schema.templatePreviews.owner, owner), eq(schema.templatePreviews.id, sandbox.name))
  const [reserved] = await db.select({ expiresAt: schema.templatePreviews.expiresAt }).from(schema.templatePreviews).where(slot)
  const claim = new Date(extendedTo + 60_000)
  // A slot reserved past the sandbox's expiry is another extension's claim the sandbox hasn't caught up with yet: it decides.
  const pending = !reserved || reserved.expiresAt.getTime() > expiresAt + 60_000
  const claimed = !pending && reserved.expiresAt < claim && await db.update(schema.templatePreviews)
    .set({ expiresAt: claim })
    .where(and(slot, eq(schema.templatePreviews.expiresAt, reserved.expiresAt)))
    .returning({ id: schema.templatePreviews.id })
  if (!claimed || !claimed.length) {
    throw createError({ statusCode: 423, message: 'This preview is already being extended.' })
  }
  const result = { expiresAt: extendedTo, canExtend: limit - extendedTo >= 60_000 }
  try {
    await sandbox.extendTimeout(duration)
  } catch (error) {
    // The extension may still have reached the sandbox. If it didn't, the claim goes back, so a retry can extend.
    // When the sandbox can't be read either, the outcome is unknown: the claim stays, so the slot never runs out before the sandbox.
    const current = await Sandbox.get({ name: sandbox.name }).catch(() => null)
    if (!current) throw error
    if (previewExpiresAt(current) >= extendedTo) return result
    await db.update(schema.templatePreviews)
      .set({ expiresAt: reserved.expiresAt })
      .where(and(slot, eq(schema.templatePreviews.expiresAt, claim)))
      .returning({ id: schema.templatePreviews.id })
    throw error
  }
  return result
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
