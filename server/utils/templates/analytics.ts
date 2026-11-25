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

// `track` posts to `VERCEL_URL`, the deployment's own `*.vercel.app` URL. Deployment Protection answers it with a 401, which
// `track` never checks, so no event arrives. Production sends to its public domain instead, which protection leaves open.
if (process.env.VERCEL_ENV === 'production' && !process.env.VERCEL_WEB_ANALYTICS_ENDPOINT && process.env.VERCEL_PROJECT_PRODUCTION_URL) {
  process.env.VERCEL_WEB_ANALYTICS_ENDPOINT = `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}/_vercel/insights/event`
}

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

/**
 * Shell that succeeds for one caller only, however many race for `name`: with noclobber, bash creates the file exclusively.
 * `mkdir` is no such claim: uutils coreutils 0.10 (Ubuntu 26.04) reports success to every caller that raced for the path.
 */
const claim = (name: string) => `(set -C; : > ${STATE_DIR}/${name}) 2>/dev/null`

/** True the first time `step` happens in this preview, even when parallel requests reach it together. */
export async function claimPreviewStep(sandbox: Sandbox, step: string) {
  return (await run(sandbox, `mkdir -p ${STATE_DIR} && ${claim(step)} && echo claimed`)).includes('claimed')
}

const changeLevel = (count: number) => CHANGE_LEVELS.findLast(level => count >= level)

/** Counts one Nuxi change, and reports each level (`'1+'`, `'5+'`, `'20+'`) the first time the preview reaches it. */
export function trackPreviewChange(event: H3Event, sandbox: Sandbox) {
  const template = sandbox.tags?.template
  trackTemplateEvent(event, 'Template Edited', recordPreviewChange(sandbox).then(levels => levels.map(changes => ({ template, changes }))))
}

async function recordPreviewChange(sandbox: Sandbox) {
  // One byte per change: appends don't lose concurrent changes, and each level is claimed once even when two changes see it.
  const claims = CHANGE_LEVELS.map(level => `[ "$n" -ge ${level} ] && ${claim(`changes-${level}`)} && echo ${level}`).join('; ')
  const output = await run(sandbox, `mkdir -p ${STATE_DIR} && printf x >> ${STATE_DIR}/changes && n=$(stat -c %s ${STATE_DIR}/changes); ${claims}; true`)
  return output.split('\n').filter(Boolean).map(level => `${level}+`)
}

/** How many changes Nuxi made to this preview, as a level: `'0'`, `'1+'`, `'5+'` or `'20+'`. */
export async function previewChanges(sandbox: Sandbox) {
  const level = changeLevel(Number(await run(sandbox, `stat -c %s ${STATE_DIR}/changes 2>/dev/null || echo 0`)) || 0)
  return level ? `${level}+` : '0'
}
