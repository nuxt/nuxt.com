import { track } from '@vercel/analytics/server'
import { waitUntil } from '@vercel/functions'
import type { Sandbox } from '@vercel/sandbox'
import type { H3Event } from 'h3'

/**
 * Template preview analytics, a funnel with one event per step and preview:
 * `Template Preview Started` → `Template Editor Started` → `Template Edited` (at 1, 5 and 20 Nuxi changes) → `Template Downloaded` (once, at the first ZIP),
 * plus `Template Module Added` and `Template Preview Failed`. Vercel Pro keeps two properties per event: `template` and one more.
 */
type TemplateEvent = 'Template Preview Started' | 'Template Editor Started' | 'Template Edited' | 'Template Module Added' | 'Template Downloaded' | 'Template Preview Failed'
type Properties = { template: string | undefined } & Record<string, string | undefined>

/** Lives outside the project, so the ZIP leaves it out, and dies with the sandbox. */
const STATE_DIR = '/tmp/nuxt-com-analytics'
/** How deep a preview's editing went, reported once per level instead of once per change. */
const CHANGE_LEVELS = [1, 5, 20]

/**
 * Sends the event once `properties` resolve, after the response: it never slows or fails the request.
 * Resolving to `null` skips it, and to a list sends one event per item.
 */
export function trackTemplateEvent(event: H3Event, name: TemplateEvent, properties: Properties | Promise<Properties | Properties[] | null>) {
  const headers = getRequestHeaders(event)
  waitUntil(Promise.resolve(properties)
    .then(data => Promise.all([data ?? []].flat().map(item => track(name, item, { headers }))))
    .catch(error => console.error('[templates] analytics failed', error)))
}

async function run(sandbox: Sandbox, script: string) {
  const result = await sandbox.runCommand({ cmd: 'bash', args: ['-c', script], signal: AbortSignal.timeout(10_000) })
  return await result.stdout()
}

/** True the first time `step` happens in this preview. `mkdir` is atomic, so parallel requests can't both claim it. */
export async function claimPreviewStep(sandbox: Sandbox, step: string) {
  return (await run(sandbox, `mkdir -p ${STATE_DIR} && mkdir ${STATE_DIR}/${step} 2>/dev/null && echo claimed`)).includes('claimed')
}

const changeLevel = (count: number) => CHANGE_LEVELS.findLast(level => count >= level)

/** Counts one Nuxi change, and reports each level (`'1+'`, `'5+'`, `'20+'`) the first time the preview reaches it. */
export function trackPreviewChange(event: H3Event, sandbox: Sandbox) {
  const template = sandbox.tags?.template
  trackTemplateEvent(event, 'Template Edited', recordPreviewChange(sandbox).then(levels => levels.map(changes => ({ template, changes }))))
}

async function recordPreviewChange(sandbox: Sandbox) {
  // One byte per change: appends don't lose concurrent changes, and each level is claimed once even when two changes see it.
  const claims = CHANGE_LEVELS.map(level => `[ "$n" -ge ${level} ] && mkdir ${STATE_DIR}/changes-${level} 2>/dev/null && echo ${level}`).join('; ')
  const output = await run(sandbox, `mkdir -p ${STATE_DIR} && printf x >> ${STATE_DIR}/changes && n=$(stat -c %s ${STATE_DIR}/changes); ${claims}; true`)
  return output.split('\n').filter(Boolean).map(level => `${level}+`)
}

/** How many changes Nuxi made to this preview, as a level: `'0'`, `'1+'`, `'5+'` or `'20+'`. */
export async function previewChanges(sandbox: Sandbox) {
  const level = changeLevel(Number(await run(sandbox, `stat -c %s ${STATE_DIR}/changes 2>/dev/null || echo 0`)) || 0)
  return level ? `${level}+` : '0'
}
