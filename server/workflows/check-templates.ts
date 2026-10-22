import { Sandbox, Snapshot } from '@vercel/sandbox'
import { FatalError, defineHook, getWorkflowMetadata, sleep } from 'workflow'
import { start } from 'workflow/api'
import { z } from 'zod'
import type { TemplateCheckPhase, TemplateCheckStep, TemplateToCheck } from '../../shared/types/templates'
import type { CheckReport } from '../utils/templates/check-report'
import { PREVIEW_BRIDGE_PLUGIN } from '../utils/templates/preview-bridge'
import { SERVE_SCRIPT_PATH, STATIC_SERVER, STATIC_SERVER_PATH } from '../utils/templates/static-server'
import { TEMPLATE_SNAPSHOT_TTL_MS } from '../../shared/utils/templates'

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
const WORKDIR = '/vercel/app'
const STATE_DIR = '/tmp/nuxt-com-check'
const BROWSER_DIR = '/tmp/browser'
const LANES = 8
/** Install and build can take 15 minutes, far longer than a step may run: they run detached and the workflow checks on them. */
const POLL_INTERVAL = '15s'
const MAX_POLLS = 4 * 30

type CheckResult = { slug: string, status: 'passed' | 'failed' | 'stopped', step?: TemplateCheckStep, nuxt?: string, live: boolean }

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

function createReporter(baseURL: string, slug: string, runId: string) {
  return {
    baseURL,
    slug,
    runId,
    start: (batchId: string) => recordCheck(baseURL, { kind: 'start', slug, runId, batchId }),
    phase: (phase: TemplateCheckPhase, sandbox?: string) => recordCheck(baseURL, { kind: 'progress', slug, runId, phase, sandbox }),
    finish: (result: { status: 'passed' | 'failed', step?: TemplateCheckStep, nuxt?: string, snapshotId?: string, log?: string }) => recordCheck(baseURL, { kind: 'finish', slug, runId, ...result })
  }
}

async function checkTemplate(report: Reporter, batchId: string, template: TemplateToCheck, browser?: string): Promise<CheckResult> {
  const stopped: CheckResult = { slug: template.slug, status: 'stopped', live: false }
  // Refused when another run queued this template since.
  if ((await report.start(batchId)).stopped) return stopped

  const fail = async (step: TemplateCheckStep, log: string): Promise<CheckResult> => {
    await report.finish({ status: 'failed', step, log })
    return { slug: template.slug, status: 'failed', step, live: false }
  }

  const sandbox = await createCheckSandbox(template)
  let snapshotted = false
  try {
    if ((await report.phase('install', sandbox)).stopped) return stopped
    const install = await runDetached(sandbox, 'install', INSTALL_SCRIPT, { report, phase: 'install', log: '/tmp/install.log' })
    if (install.stopped) return stopped
    if (!install.ok) return await fail('install', install.output)
    const nuxt = install.output.trim().split('\n').pop()!

    if ((await report.phase('build')).stopped) return stopped
    const build = await runDetached(sandbox, 'build', buildScript(template.live), { report, phase: 'build', log: '/tmp/build.log' })
    if (build.stopped) return stopped
    if (!build.ok) return await fail('build', build.output)
    const lines = build.output.trim().split('\n')
    const nodeServer = lines.pop() === 'node-server'
    const serve = serveScript(lines.pop()?.trim() ?? '', nodeServer)

    let snapshotId: string | undefined
    if (template.live && serve && browser) {
      if ((await report.phase('start')).stopped) return stopped
      const started = await startTemplate(sandbox, serve, browser)
      if (!started.ok) return await fail('start', started.output)
      if ((await report.phase('snapshot')).stopped) return stopped
      snapshotId = await snapshotSandbox(sandbox)
      snapshotted = true
    }

    const { previousSnapshotId, stopped: refused } = await report.finish({ status: 'passed', nuxt, snapshotId })
    // Stopped while snapshotting: the row keeps its last snapshot, so this one is the one to delete.
    if (refused && snapshotId) await deleteSnapshot(snapshotId)
    if (refused) return stopped
    if (previousSnapshotId) await deleteSnapshot(previousSnapshotId)
    return { slug: template.slug, status: 'passed', nuxt, live: !!snapshotId }
  } finally {
    if (!snapshotted) await stopSandbox(sandbox)
  }
}

/**
 * Runs a script in the background and checks on it every `POLL_INTERVAL`, so the workflow sleeps instead of holding a function open.
 * With `progress`, each check also sends the end of `progress.log` to the template's row, so its log can be followed live.
 */
async function runDetached(sandbox: string, id: string, script: string, progress?: { report: Reporter, phase: TemplateCheckPhase, log: string }, cwd = WORKDIR) {
  await startScript(sandbox, id, script, cwd)
  const target = progress && { baseURL: progress.report.baseURL, slug: progress.report.slug, runId: progress.report.runId, phase: progress.phase, log: progress.log }
  for (let poll = 0; poll < MAX_POLLS; poll++) {
    await sleep(POLL_INTERVAL)
    const result = await readScript(sandbox, id, target)
    if (result) return result
  }
  return { ok: false, stopped: false, output: `The ${id} step was still running after 30 minutes.` }
}

// pnpm 11+ fails installs whose dependency build scripts it skipped; a developer approves them once, so the check allows them.
// Native modules without a prebuilt binary need a compiler, which most development machines have and the sandbox image doesn't.
const PM = '$(if [ -f pnpm-lock.yaml ]; then echo pnpm; elif [ -f yarn.lock ]; then echo yarn; elif [ -f bun.lock ] || [ -f bun.lockb ]; then echo bun; else echo npm; fi)'
// The error is often far above the end of the log (prerender output follows it): failures print every error line, then the end.
const FAIL_WITH = `fail_with() {
  echo "$1"
  errors=$(sed -E 's/\\x1b\\[[0-9;]*[A-Za-z]//g' "$2" | grep -iE '(^|[^a-z])(error|err!|fatal|failed|cannot find|not found|exception|enoent|eaddrinuse)' | grep -viE '^[[:space:]]*(warn|⚠)' | awk '!seen[$0]++' | tail -25)
  [ -n "$errors" ] && printf '\\n==> Errors\\n%s\\n' "$errors"
  printf '\\n==> Last lines of %s\\n' "$(basename "$2")"
  sed -E 's/\\x1b\\[[0-9;]*[A-Za-z]//g' "$2" | tail -120
  exit 1
}`
const INSTALL_SCRIPT = `${FAIL_WITH}
corepack enable >/dev/null 2>&1 || sudo corepack enable >/dev/null 2>&1 || true; PM=${PM}
export pnpm_config_strict_dep_builds=false pnpm_config_dangerously_allow_all_builds=true
timeout 600 $PM install > /tmp/install.log 2>&1 || {
  grep -q "gyp ERR" /tmp/install.log && { { sudo apt-get update -qq && sudo DEBIAN_FRONTEND=noninteractive apt-get install -y -qq build-essential python3; } || sudo dnf install -y -q python3 make gcc-c++; } > /dev/null 2>&1 && timeout 600 $PM install > /tmp/install.log 2>&1
} || fail_with "The install failed." /tmp/install.log
if node -e "process.exit(+require('./node_modules/@nuxt/content/package.json').version.split('.')[0] >= 3 ? 0 : 1)" 2>/dev/null && ! grep -q better-sqlite3 package.json && ! grep -q sqliteConnector nuxt.config.*; then $PM add better-sqlite3 >> /tmp/install.log 2>&1 || true; fi
node -p "require('nuxt/package.json').version"`

// `nuxt build` can exit 0 when a prerender promise never settles, before writing assets or the server: only Nitro's last line proves it finished.
// Prints the preview command Nitro suggests, then whether a Node server was built.
function buildScript(live: boolean) {
  return `${FAIL_WITH}
${live ? `PLUGINS=$([ -d app ] && echo app/plugins || echo plugins); mkdir -p $PLUGINS && cp ${STATE_DIR}/nuxt-com-preview.client.js $PLUGINS/;` : ''} PM=${PM}
NUXT_TELEMETRY_DISABLED=1 timeout 900 $PM run build > /tmp/build.log 2>&1 || fail_with "The build failed." /tmp/build.log
test -f .output/server/index.mjs || grep -qE "(preview|deploy) this build" /tmp/build.log || fail_with "The build exited before Nitro finished." /tmp/build.log
sed -E 's/\\x1b\\[[0-9;]*m//g' /tmp/build.log | grep -oE "preview this build using .*" | tail -1 | sed -E 's/^preview this build using //; s/\`//g'
test -f .output/server/index.mjs && echo node-server || echo no-node-server`
}

/** How to start the build, from the preview command Nitro printed. `undefined` for presets that only run on their platform (Cloudflare, Deno…). */
function serveScript(preview: string, hasNodeServer: boolean) {
  const server = preview.match(/^node (\S+\/server\/index\.mjs)$/)?.[1]
  if (server) return `exec node ${server}`
  const dir = preview.match(/^npx serve (\S+)$/)?.[1]
  if (dir) return `exec node ${STATIC_SERVER_PATH} ${dir}`
  if (hasNodeServer) return 'exec node .output/server/index.mjs'
  return undefined
}

// Opens a page in Chromium and prints the first message of the preview bridge: an app can serve valid HTML and still crash once it hydrates.
const VISIT_SCRIPT = `import { chromium } from 'playwright-core'
const browser = await chromium.launch()
const errors = []
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } })
  page.on('pageerror', error => errors.push(error.message))
  await page.addInitScript(() => window.addEventListener('message', (event) => {
    if (event.data?.source === 'nuxt-com-preview') window.__preview ||= event.data
  }))
  await page.goto(process.argv[2], { waitUntil: 'load', timeout: 30_000 })
  const result = await page.waitForFunction(() => window.__preview, null, { timeout: 30_000 }).then(handle => handle.jsonValue()).catch(() => null)
  console.log(JSON.stringify({ result, errors }))
} finally {
  await browser.close()
}
`

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
  const setup = await runDetached(name, 'browser', `npm init -y > /dev/null && npm i playwright-core@1 > /dev/null 2>&1 && npx playwright-core install --with-deps chromium-headless-shell > /dev/null 2>&1`, undefined, BROWSER_DIR)
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
  await sandbox.writeFiles([{ path: `${BROWSER_DIR}/visit.mjs`, content: VISIT_SCRIPT }])
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
  await sandbox.runCommand({ cmd: 'bash', args: ['-c', `mkdir -p ${WORKDIR} && cp -a ${clone}/. ${WORKDIR}/`] })
  await sandbox.writeFiles([
    { path: `${STATE_DIR}/nuxt-com-preview.client.js`, content: PREVIEW_BRIDGE_PLUGIN },
    { path: STATIC_SERVER_PATH, content: STATIC_SERVER }
  ])
  return sandbox.name
}

async function startScript(name: string, id: string, script: string, cwd: string) {
  'use step'
  const sandbox = await getSandbox(name)
  await sandbox.writeFiles([{ path: `${STATE_DIR}/${id}.sh`, content: script }])
  await sandbox.runCommand({
    cmd: 'bash',
    args: ['-c', `mkdir -p ${cwd} && cd ${cwd} && bash ${STATE_DIR}/${id}.sh > ${STATE_DIR}/${id}.out 2>&1; echo $? > ${STATE_DIR}/${id}.exit`],
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
  const result = await sandbox.runCommand({ cmd: 'bash', args: ['-c', `test -f ${STATE_DIR}/${id}.exit && cat ${STATE_DIR}/${id}.exit && tail -c 16000 ${STATE_DIR}/${id}.out`] })
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
  await sandbox.writeFiles([{ path: SERVE_SCRIPT_PATH, content: `cd ${WORKDIR}\n${serve}\n` }])
  await sandbox.runCommand({ cmd: 'bash', args: ['-c', `export PORT=${PORT} HOST=0.0.0.0; exec bash ${SERVE_SCRIPT_PATH}`], cwd: WORKDIR, detached: true })
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

class StartError extends Error {}

/** The page answers, and every stylesheet and script it references loads. A page that renders without them looks broken. */
async function smokeTest(url: string) {
  const deadline = Date.now() + 60_000
  let response: Response | null = null
  while (Date.now() < deadline) {
    response = await fetch(url, { signal: AbortSignal.timeout(5000) }).catch(() => null)
    if (response && response.status < 500) break
    await new Promise(resolve => setTimeout(resolve, 500))
  }
  if (!response || response.status >= 400) throw new StartError(`${url} answered ${response?.status ?? 'nothing'}`)

  const html = await response.text()
  const assets = [...new Set([...html.matchAll(/(?:href|src)="(\/[^"]+\.(?:css|js|mjs))"/g)].map(match => match[1]!))]
  const failed: string[] = []
  await Promise.all(assets.slice(0, 40).map(async (asset) => {
    const status = await fetch(new URL(asset, response.url), { signal: AbortSignal.timeout(10_000) }).then(res => res.status).catch(() => 0)
    if (status !== 200) failed.push(`${status} ${asset}`)
  }))
  if (failed.length) throw new StartError(`${failed.length}/${assets.length} assets failed to load:\n${failed.slice(0, 5).join('\n')}`)
}

/** The app mounts in a real browser without crashing. */
async function browserTest(browser: Sandbox, url: string) {
  const visit = await browser.runCommand({ cmd: 'node', args: ['visit.mjs', url], cwd: BROWSER_DIR })
  if (visit.exitCode !== 0) throw new StartError(`The browser could not open ${url}:\n${(await visit.output()).slice(-800)}`)
  const { result, errors } = JSON.parse((await visit.stdout()).trim().split('\n').pop()!) as { result: { type: string, message?: string } | null, errors: string[] }
  if (result?.type === 'ready') return
  const details = result?.type === 'error' ? `It crashed in the browser: ${result.message}` : 'It never finished mounting in the browser.'
  throw new StartError([details, ...errors.slice(0, 3)].join('\n'))
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
