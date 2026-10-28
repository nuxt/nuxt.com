import { Sandbox, Snapshot } from '@vercel/sandbox'
import { FatalError, defineHook, getWorkflowMetadata, sleep } from 'workflow'
import { start } from 'workflow/api'
import { z } from 'zod'
import type { TemplateCheckStep } from '../../shared/types/templates'
import { TEMPLATE_SNAPSHOT_TTL_MS, type CheckReport, type TemplateCheckPhase, type TemplateToCheck } from '../utils/templates/check-report'
import { BROWSER_SETUP_SCRIPT, CHECK_BROWSER_DIR, CHECK_STATE_DIR, INSTALL_SCRIPT, TEMPLATE_WORKDIR, VISIT_SCRIPT, WARM_DEV_SCRIPT, buildScript, serveScript } from '../utils/templates/check-scripts'
import { DEV_WARMUP_SCRIPT } from '../utils/templates/dev-server'
import { PREVIEW_BRIDGE_PLUGIN } from '../utils/templates/preview-bridge'
import { StartError, browserTest, smokeTest } from '../utils/templates/start-check'
import { SERVE_SCRIPT_PATH, STATIC_SERVER, STATIC_SERVER_PATH } from '../utils/templates/static-server'

/**
 * Installs, builds and starts templates in a clean Vercel Sandbox, the way `create nuxt` gets them, then opens them in Chromium.
 * Results go to the `template_checks` table through `/api/internal/templates/checks`. Templates that run without secrets are
 * snapshotted once they pass, live previews restore that snapshot, and only the latest passing snapshot is kept.
 *
 * Started daily by the cron (`/api/cron/templates-check`) and by `pnpm templates:check`. Each template is a child run, so it has
 * its own log, retries and failure scope in the Vercel dashboard (Observability → Workflows).
 *
 * On Nitro v2 (Nuxt 4), Vercel builds workflows outside the Nitro bundle: steps have no `db` or auto-imports, so they import
 * everything explicitly and call internal routes for the database.
 */

const PORT = 3000
const LANES = 8
/** Install and build can take 15 minutes, far longer than a step may run: they run detached and the workflow checks on them. */
const POLL_INTERVAL = '15s'
const MAX_POLLS = 4 * 30

type CheckResult = { slug: string, status: 'passed' | 'failed' | 'stopped', step?: TemplateCheckStep, nuxt?: string, live: boolean }

/** Another run queued the template since this check started and now owns its row: the check ends without a result. */
class CheckStopped extends Error {}

/** The token a template's child run resumes once it finishes. */
function completionToken(batchId: string, slug: string) {
  return `template-check:${batchId}:${slug}`
}

export async function checkTemplatesWorkflow(input: { baseURL: string, batchId: string, templates: TemplateToCheck[] }) {
  'use workflow'

  const { baseURL, batchId, templates } = input
  const queue = [...templates]
  const results: Array<CheckResult | { slug: string, error: string }> = []
  let browser: string | undefined
  try {
    if (templates.some(template => template.live)) {
      browser = await createBrowser()
      await recordRun(baseURL, { id: batchId, browser })
    }
    await Promise.all(Array.from({ length: Math.min(LANES, queue.length) }, async () => {
      while (queue.length) {
        const template = queue.shift()!
        const completion = await startAndWait(completionToken(batchId, template.slug), token => start(checkTemplateWorkflow, [{ baseURL, batchId, template, browser, token }]).then(() => undefined))
        results.push(completion.status === 'completed' ? completion.value : { slug: template.slug, error: completion.error })
      }
    }))
  } finally {
    if (browser) await stopSandbox(browser)
    await recordRun(baseURL, { id: batchId, finished: true })
  }
  return results
}

/** Checks one template. Started by `checkTemplatesWorkflow`, which it wakes up once it finishes. */
export async function checkTemplateWorkflow(input: { baseURL: string, batchId: string, template: TemplateToCheck, browser?: string, token: string }) {
  'use workflow'

  let completion: Completion | undefined
  const { workflowRunId } = getWorkflowMetadata()
  const report = createReporter(input.baseURL, input.template.slug, workflowRunId)
  try {
    completion = { status: 'completed', value: await checkTemplate(report, input.batchId, input.template, input.browser) }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    completion = { status: 'failed', error: message }
    await recordCheck(input.baseURL, { kind: 'finish', slug: input.template.slug, runId: workflowRunId, log: `The check stopped before a result: ${message}` }).catch(() => {})
  } finally {
    if (completion) await resumeParent(input.token, completion)
  }
}

type Reporter = ReturnType<typeof createReporter>

/** Reports the check of one template to its row. Starting a phase throws `CheckStopped` once the row belongs to another run. */
function createReporter(baseURL: string, slug: string, runId: string) {
  return {
    baseURL,
    slug,
    runId,
    start: (batchId: string) => recordCheck(baseURL, { kind: 'start', slug, runId, batchId }),
    phase: async (phase: TemplateCheckPhase, sandbox?: string) => {
      if ((await recordCheck(baseURL, { kind: 'progress', slug, runId, phase, sandbox })).stopped) throw new CheckStopped()
    },
    finish: (result: { status: 'passed' | 'failed', step?: TemplateCheckStep, nuxt?: string, snapshotId?: string, log?: string }) => recordCheck(baseURL, { kind: 'finish', slug, runId, ...result })
  }
}

/** Install, build, then, for templates that run live, start in Chromium and snapshot. The first step that fails is the result. */
async function checkTemplate(report: Reporter, batchId: string, template: TemplateToCheck, browser?: string): Promise<CheckResult> {
  const stopped: CheckResult = { slug: template.slug, status: 'stopped', live: false }
  if ((await report.start(batchId)).stopped) return stopped

  const fail = async (step: TemplateCheckStep, log: string): Promise<CheckResult> => {
    await report.finish({ status: 'failed', step, log })
    return { slug: template.slug, status: 'failed', step, live: false }
  }

  const sandbox = await createCheckSandbox(template)
  let snapshotted = false
  try {
    await report.phase('install', sandbox)
    const install = await runDetached(sandbox, 'install', INSTALL_SCRIPT, { report, phase: 'install', log: '/tmp/install.log' })
    if (!install.ok) return await fail('install', install.output)
    const nuxt = install.output.trim().split('\n').pop()!

    await report.phase('build')
    const build = await runDetached(sandbox, 'build', buildScript(template.live), { report, phase: 'build', log: '/tmp/build.log' })
    if (!build.ok) return await fail('build', build.output)
    const serve = serveScript(build.output)

    let snapshotId: string | undefined
    if (template.live && serve && browser) {
      await report.phase('start')
      const started = await startTemplate(sandbox, serve, browser)
      if (!started.ok) return await fail('start', started.output)
      await report.phase('snapshot')
      // Failing only leaves the bundling to the first `nuxt dev` started from the snapshot.
      await runDetached(sandbox, 'warm-dev', WARM_DEV_SCRIPT)
      snapshotId = await snapshotSandbox(sandbox)
      snapshotted = true
    }

    const { previousSnapshotId, stopped: refused } = await report.finish({ status: 'passed', nuxt, snapshotId })
    // Stopped while snapshotting: the row keeps its last snapshot, so this one is the one to delete.
    if (refused && snapshotId) await deleteSnapshot(snapshotId)
    if (refused) return stopped
    if (previousSnapshotId) await deleteSnapshot(previousSnapshotId)
    return { slug: template.slug, status: 'passed', nuxt, live: !!snapshotId }
  } catch (error) {
    if (error instanceof CheckStopped) return stopped
    throw error
  } finally {
    if (!snapshotted) await stopSandbox(sandbox)
  }
}

/**
 * Runs a script in the background and checks on it every `POLL_INTERVAL`, so the workflow sleeps instead of holding a function open.
 * With `progress`, each check also sends the end of `progress.log` to the template's row, so its log can be followed live.
 */
async function runDetached(sandbox: string, id: string, script: string, progress?: { report: Reporter, phase: TemplateCheckPhase, log: string }, cwd = TEMPLATE_WORKDIR) {
  await startScript(sandbox, id, script, cwd)
  const target = progress && { baseURL: progress.report.baseURL, slug: progress.report.slug, runId: progress.report.runId, phase: progress.phase, log: progress.log }
  for (let poll = 0; poll < MAX_POLLS; poll++) {
    await sleep(POLL_INTERVAL)
    const result = await readScript(sandbox, id, target)
    if (result?.stopped) throw new CheckStopped()
    if (result) return result
  }
  return { ok: false, output: `The ${id} step was still running after 30 minutes.` }
}

// ---- Steps ----

const completionHook = defineHook({
  schema: z.discriminatedUnion('status', [
    z.object({ status: z.literal('completed'), value: z.custom<CheckResult>() }),
    z.object({ status: z.literal('failed'), error: z.string() })
  ])
})
type Completion = { status: 'completed', value: CheckResult } | { status: 'failed', error: string }

async function startAndWait(token: string, startChild: (token: string) => Promise<void>): Promise<Completion> {
  const hook = completionHook.create({ token })
  await startChild(token)
  return await hook
}

async function resumeParent(token: string, completion: Completion) {
  'use step'
  await completionHook.resume(token, completion)
}

/** A running sandbox. A stopped one ran out of time: getting it must not start a new session. */
async function getSandbox(name: string) {
  const sandbox = await Sandbox.get({ name })
  if (sandbox.status !== 'running') throw new FatalError(`Sandbox ${name} is ${sandbox.status}.`)
  return sandbox
}

/** One Chromium sandbox shared by the run, so template snapshots stay free of it. */
async function createBrowser() {
  const name = await createBrowserSandbox()
  const setup = await runDetached(name, 'browser', BROWSER_SETUP_SCRIPT, undefined, CHECK_BROWSER_DIR)
  if (!setup.ok) throw new Error(`Chromium setup failed:\n${setup.output}`)
  return name
}

async function createBrowserSandbox() {
  'use step'
  const sandbox = await Sandbox.create({
    name: `templates-check-browser-${crypto.randomUUID().slice(0, 8)}`,
    timeout: 45 * 60 * 1000,
    persistent: false,
    resources: { vcpus: 4 },
    tags: { app: 'nuxt-com', purpose: 'templates-check-browser' }
  })
  await sandbox.writeFiles([{ path: `${CHECK_BROWSER_DIR}/visit.mjs`, content: VISIT_SCRIPT }])
  return sandbox.name
}

async function createCheckSandbox(template: TemplateToCheck) {
  'use step'
  const [, repoName, ...subdir] = template.source ? template.source.replace(/^gh:/, '').split('/') : template.repo.split('/')
  const clone = `/vercel/${repoName}${subdir.length ? `/${subdir.join('/')}` : ''}`
  const sandbox = await Sandbox.create({
    // Snapshots can't be named: the dashboard and `Snapshot.list({ name })` identify them by this sandbox.
    name: `templates-check-${template.slug}-${crypto.randomUUID().slice(0, 8)}`,
    source: { type: 'git', url: `https://github.com/${template.repo}.git`, depth: 1, ...(template.branch ? { revision: template.branch } : {}) },
    ports: [PORT],
    timeout: 45 * 60 * 1000,
    persistent: false,
    resources: { vcpus: 4 },
    tags: { app: 'nuxt-com', purpose: 'templates-check', template: template.slug }
  })
  const copy = await sandbox.runCommand({ cmd: 'bash', args: ['-c', `mkdir -p ${TEMPLATE_WORKDIR} && cp -a ${clone}/. ${TEMPLATE_WORKDIR}/`] })
  // `checkTemplate` only stops the sandbox once this step returns its name.
  if (copy.exitCode !== 0) {
    const output = (await copy.stderr()).slice(-800)
    await sandbox.stop().catch(() => {})
    throw new FatalError(`Copying ${clone} to ${TEMPLATE_WORKDIR} failed: ${output}`)
  }
  await sandbox.writeFiles([
    { path: `${CHECK_STATE_DIR}/nuxt-com-preview.client.js`, content: PREVIEW_BRIDGE_PLUGIN },
    { path: STATIC_SERVER_PATH, content: STATIC_SERVER },
    { path: `${CHECK_STATE_DIR}/warmup.mjs`, content: DEV_WARMUP_SCRIPT }
  ])
  return sandbox.name
}

async function startScript(name: string, id: string, script: string, cwd: string) {
  'use step'
  const sandbox = await getSandbox(name)
  await sandbox.writeFiles([{ path: `${CHECK_STATE_DIR}/${id}.sh`, content: script }])
  await sandbox.runCommand({
    cmd: 'bash',
    args: ['-c', `mkdir -p ${cwd} && cd ${cwd} && bash ${CHECK_STATE_DIR}/${id}.sh > ${CHECK_STATE_DIR}/${id}.out 2>&1; echo $? > ${CHECK_STATE_DIR}/${id}.exit`],
    detached: true
  })
}

/**
 * `null` while the script runs, then its exit and the end of its output.
 * With `progress`, a running script also sends the end of its log, and `stopped` comes back once the check no longer owns the row.
 */
async function readScript(name: string, id: string, progress?: { baseURL: string, slug: string, runId: string, phase: TemplateCheckPhase, log: string }) {
  'use step'
  const sandbox = await Sandbox.get({ name })
  if (sandbox.status !== 'running') return { ok: false, stopped: false, output: 'The sandbox ran out of time.' }
  const result = await sandbox.runCommand({ cmd: 'bash', args: ['-c', `test -f ${CHECK_STATE_DIR}/${id}.exit && cat ${CHECK_STATE_DIR}/${id}.exit && tail -c 16000 ${CHECK_STATE_DIR}/${id}.out`] })
  if (result.exitCode === 0) {
    const [exit, ...output] = (await result.stdout()).split('\n')
    return { ok: exit!.trim() === '0', stopped: false, output: output.join('\n') }
  }
  if (!progress) return null

  const tail = await sandbox.runCommand({ cmd: 'bash', args: ['-c', `tail -c 8000 ${progress.log} 2>/dev/null | sed -E 's/\\x1b\\[[0-9;]*[A-Za-z]//g'`] })
  const { stopped } = await internalPost<{ stopped: boolean }>(progress.baseURL, '/api/internal/templates/checks', {
    kind: 'progress', slug: progress.slug, runId: progress.runId, phase: progress.phase, log: await tail.stdout()
  })
  return stopped ? { ok: false, stopped: true, output: '' } : null
}

/** Starts the production build, checks that every asset loads and that the app mounts in Chromium. */
async function startTemplate(name: string, serve: string, browserName: string) {
  'use step'
  const sandbox = await getSandbox(name)
  await sandbox.writeFiles([{ path: SERVE_SCRIPT_PATH, content: `cd ${TEMPLATE_WORKDIR}\n${serve}\n` }])
  await sandbox.runCommand({ cmd: 'bash', args: ['-c', `export PORT=${PORT} HOST=0.0.0.0; exec bash ${SERVE_SCRIPT_PATH}`], cwd: TEMPLATE_WORKDIR, detached: true })
  const url = sandbox.domain(PORT)
  try {
    await smokeTest(url)
    const browser = await getSandbox(browserName)
    await browser.extendTimeout(5 * 60 * 1000).catch(() => {})
    await browserTest(browser, url)
    return { ok: true, output: '' }
  } catch (error) {
    if (!(error instanceof StartError)) throw error
    return { ok: false, output: error.message }
  }
}

/** The next passing check replaces it, well before it expires. Stops the sandbox. */
async function snapshotSandbox(name: string) {
  'use step'
  const snapshot = await (await getSandbox(name)).snapshot({ expiration: TEMPLATE_SNAPSHOT_TTL_MS })
  return snapshot.snapshotId
}

async function deleteSnapshot(snapshotId: string) {
  'use step'
  const snapshot = await Snapshot.get({ snapshotId }).catch(() => null)
  await snapshot?.delete()
}

async function stopSandbox(name: string) {
  'use step'
  const sandbox = await Sandbox.get({ name }).catch(() => null)
  if (sandbox?.status === 'running') await sandbox.stop()
}

/**
 * Writes to `template_checks`. `stopped` means the row no longer belongs to this check (another run queued the template), so the check ends.
 * A passing finish returns the snapshot it replaced, to delete it.
 */
async function recordCheck(baseURL: string, body: CheckReport) {
  'use step'
  return internalPost<{ stopped: boolean, previousSnapshotId?: string }>(baseURL, '/api/internal/templates/checks', body)
}

/** Records the run's browser sandbox, so stopping the run stops it too, and closes the run once every template finished. */
async function recordRun(baseURL: string, body: { id: string, browser?: string, finished?: boolean }) {
  'use step'
  return internalPost(baseURL, '/api/internal/templates/runs', body)
}

async function internalPost<T>(baseURL: string, path: string, body: Record<string, unknown>): Promise<T> {
  const secret = process.env.INTERNAL_API_SECRET?.trim()
  if (!secret) throw new FatalError('INTERNAL_API_SECRET is not configured')

  const response = await fetch(new URL(path, baseURL), {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${secret}`,
      'content-type': 'application/json',
      // Lets the deployment call itself while Vercel Authentication is on (preview deploys).
      ...(process.env.VERCEL_AUTOMATION_BYPASS_SECRET ? { 'x-vercel-protection-bypass': process.env.VERCEL_AUTOMATION_BYPASS_SECRET } : {})
    },
    body: JSON.stringify(body)
  })
  if (!response.ok) {
    const message = `${path} failed (${response.status}): ${await response.text()}`
    if (response.status >= 400 && response.status < 500 && response.status !== 429) throw new FatalError(message)
    throw new Error(message)
  }
  return await response.json() as T
}
