import { Readable } from 'node:stream'
import { stripVTControlCharacters } from 'node:util'
import type { Sandbox } from '@vercel/sandbox'
import { createError } from 'h3'
import { SAXParser } from 'parse5-sax-parser'
import { DEV_LOG, DEV_PORT, DEV_WARMUP_SCRIPT, DISABLE_DEVTOOLS } from './dev-server'
import { PREVIEW_BOOT_GUARD, PREVIEW_BRIDGE_PLUGIN } from './preview-bridge'
import { TEMPLATE_WORKDIR as WORKDIR } from './check-scripts'

/** Paths the editing tools accept: relative to the app root, outside dependencies, build output and git. */
const BLOCKED_DIRS = /^(?:node_modules|\.output|\.nuxt|\.data|\.git|\.vercel)(?:\/|$)/

export function resolveAppPath(path: string) {
  const clean = path.trim().replace(/^\.?\/+/, '')
  if (!clean || clean.split('/').includes('..') || BLOCKED_DIRS.test(clean) || !/^[\w@.\-/[\]() ]+$/.test(clean)) {
    throw createError({ statusCode: 400, message: `Not an editable path: ${path}` })
  }
  return { path: clean, absolute: `${WORKDIR}/${clean}` }
}

async function run(sandbox: Sandbox, script: string, timeoutMs = 30_000) {
  const result = await sandbox.runCommand({ cmd: 'bash', args: ['-c', script], cwd: WORKDIR, signal: AbortSignal.timeout(timeoutMs) })
  const [stdout, stderr] = await Promise.all([result.stdout(), result.stderr()])
  return { exitCode: result.exitCode, output: `${stdout}${stderr}`.trim() }
}

export async function listAppFiles(sandbox: Sandbox) {
  const { output } = await run(sandbox, `find . \\( -path './node_modules' -o -path './.output' -o -path './.nuxt' -o -path './.data' -o -path './.git' \\) -prune -o -type f -not -name 'nuxt-com-preview*' -not -name '*.lock' -not -name 'package-lock.json' -not -name 'pnpm-lock.yaml' -print | sed 's|^./||' | sort | head -400`)
  return output.split('\n').filter(Boolean)
}

const MAX_READ_CHARS = 40_000

export async function readAppFile(sandbox: Sandbox, path: string) {
  const file = resolveAppPath(path)
  const buffer = await sandbox.readFileToBuffer({ path: file.absolute })
  if (!buffer) return null
  if (buffer.includes(0)) throw createError({ statusCode: 400, message: `${file.path} is a binary file.` })
  const content = buffer.toString('utf8')
  return { path: file.path, content: content.slice(0, MAX_READ_CHARS), truncated: content.length > MAX_READ_CHARS }
}

/** Where Nuxt looks for source files: `app/` when it exists, the root otherwise. */
const SOURCE_FILES = /^(?:pages|components|layouts|composables|middleware|plugins|assets)\/|^(?:app\.vue|app\.config\.[jt]s|error\.vue)$/

export async function writeAppFile(sandbox: Sandbox, path: string, content: string) {
  const file = resolveAppPath(path)
  const inApp = file.path.startsWith('app/')
  if (inApp || SOURCE_FILES.test(file.path)) {
    const { output } = await run(sandbox, `test -e '${file.absolute}' && echo exists; test -d app && echo app`)
    const exists = output.includes('exists')
    const hasApp = output.includes('app')
    // Creating `app/` in a root-source app (like Docus) moves Nuxt's source directory there, and every existing page stops resolving.
    if (!exists && inApp && !hasApp) {
      throw createError({ statusCode: 422, message: `This app keeps its source at the root, without an app/ directory. Creating ${file.path} would switch Nuxt's source directory to app/ and break the app: use ${file.path.slice(4)} instead.` })
    }
    if (!exists && !inApp && hasApp) {
      throw createError({ statusCode: 422, message: `This app keeps its source in app/, and Nuxt ignores ${file.path} at the root: use app/${file.path} instead.` })
    }
  }
  await run(sandbox, `mkdir -p "$(dirname '${file.absolute}')"`)
  await sandbox.writeFiles([{ path: file.absolute, content }])
  return file.path
}

export async function deleteAppFile(sandbox: Sandbox, path: string) {
  const file = resolveAppPath(path)
  await run(sandbox, `rm -f -- '${file.absolute}'`)
  return file.path
}

const NPM_NAME = /^(?:@[a-z0-9][\w.-]*\/)?[a-z0-9][\w.-]*(?:@[\w.^~<>=-]+)?$/i

/** Changing these restarts `nuxt dev` instead of hot reloading, and a page open during the restart stays blank. */
export const RESTARTING_FILES = /^(?:nuxt\.config\.[cm]?[jt]s|package\.json|\.env)$/

/** Installs a module, then waits for `nuxt dev` to restart with it, so the page reloads onto the new build rather than mid-restart. */
export async function addAppModule(sandbox: Sandbox, name: string) {
  if (!NPM_NAME.test(name)) throw createError({ statusCode: 400, message: `Not a module name: ${name}` })
  const offset = await devLogSize(sandbox)
  // The template's own CLI skips downloading `nuxi@latest`, and the check installed with the same pnpm settings.
  const result = await run(sandbox, `export pnpm_config_strict_dep_builds=false pnpm_config_dangerously_allow_all_builds=true npm_config_audit=false npm_config_fund=false npm_config_prefer_offline=true NUXT_TELEMETRY_DISABLED=1; { ./node_modules/.bin/nuxt module add ${name} || npx --yes nuxi@latest module add ${name}; } 2>&1 | tail -40; exit \${PIPESTATUS[0]}`, 180_000)
  if (result.exitCode === 0) await waitForRestart(sandbox, offset)
  return { ...result, output: stripVTControlCharacters(result.output) }
}

export async function devLogSize(sandbox: Sandbox) {
  return Number((await run(sandbox, `stat -c %s ${DEV_LOG} 2>/dev/null || echo 0`)).output) || 0
}

/** Waits for `nuxt dev` to notice a change made after `offset` in its log, restart, and bundle the page again. */
export async function waitForRestart(sandbox: Sandbox, offset: number) {
  const result = await run(sandbox, `for i in $(seq 1 40); do [ "$(stat -c %s ${DEV_LOG})" -gt ${offset} ] && break; sleep 0.25; done; node ${WARMUP_PATH}`, 150_000)
  if (result.exitCode !== 0) {
    throw createError({ statusCode: 504, message: 'The dev server did not restart.' })
  }
}

/** Nuxt Content re-indexes a changed file a moment after it's written: until then, its pages render the old text. */
export async function waitForContent(sandbox: Sandbox, offset: number) {
  await run(sandbox, `for i in $(seq 1 40); do tail -c +${offset + 1} ${DEV_LOG} | grep -q 'changed on' && sleep 1 && break; sleep 0.25; done`)
}

/** What the visitor would see on `path`: the status, the page's text, and the dev server's latest errors. */
export async function checkAppPage(sandbox: Sandbox, path: string) {
  const route = path.startsWith('/') ? path : `/${path}`
  if (!/^\/[\w\-./~%?=&#[\]@]*$/.test(route)) throw createError({ statusCode: 400, message: `Not a route: ${path}` })
  const { output, exitCode } = await run(sandbox, `curl -s -o /tmp/nuxt-com-page.html -w '%{http_code}' --max-filesize ${MAX_PAGE_BYTES} --max-time 60 'http://127.0.0.1:${DEV_PORT}${route}'`, 70_000)
  if (exitCode === 63) throw pageTooLarge()
  const [html, log] = await Promise.all([
    readPageHtml(sandbox),
    devServerLog(sandbox)
  ])
  const text = pageText(html)
  const errors = log.split('\n').filter(line => /\b\w*error\b|\bfailed\b|\bcannot\b|\bnot found\b/i.test(line)).slice(-15)
  return {
    status: Number(output) || 0,
    text: text || '(the page rendered no text)',
    devServerErrors: errors.length ? errors : undefined
  }
}

const MAX_PAGE_BYTES = 1024 * 1024
const pageTooLarge = () => createError({ statusCode: 413, message: 'The page is too large to check (maximum 1 MiB).' })

/** The sandbox can change the file after curl finishes, so enforce the cap again while reading it. */
async function readPageHtml(sandbox: Sandbox) {
  const controller = new AbortController()
  const stream = await sandbox.readFile({ path: '/tmp/nuxt-com-page.html' }, { signal: AbortSignal.any([controller.signal, AbortSignal.timeout(10_000)]) })
  if (!stream) return ''
  const chunks: Buffer[] = []
  let size = 0
  try {
    for await (const chunk of new Readable().wrap(stream)) {
      size += chunk.length
      if (size > MAX_PAGE_BYTES) throw pageTooLarge()
      chunks.push(chunk)
    }
    return Buffer.concat(chunks, size).toString('utf8')
  } finally {
    controller.abort()
  }
}

/** Tokenize without building or executing a DOM, and retain only the tool's short text excerpt. */
function pageText(html: string) {
  const parser = new SAXParser()
  const hidden: string[] = []
  let text = ''
  const append = (value: string) => {
    if (text.length >= 1500) return
    const normalized = value.replace(/\s+/g, ' ')
    text += (text.endsWith(' ') || !text ? normalized.trimStart() : normalized).slice(0, 1500 - text.length)
  }
  parser.on('startTag', ({ tagName }) => {
    append(' ')
    if (tagName === 'script' || tagName === 'style' || tagName === 'template') hidden.push(tagName)
  })
  parser.on('endTag', ({ tagName }) => {
    if (hidden.at(-1) === tagName) hidden.pop()
    append(' ')
  })
  parser.on('text', ({ text }) => {
    if (!hidden.length) append(text)
  })
  parser.end(html)
  return text.trim()
}

const DEV_STARTED = '/tmp/nuxt-com-dev-started'
const DEV_PID = '/tmp/nuxt-com-dev.pid'
const DEV_READY = '/tmp/nuxt-com-dev-ready'
const WARMUP_PATH = '/tmp/nuxt-com-warmup.mjs'
const BRIDGE_PATH = '/tmp/nuxt-com-preview.client.js'
const BOOT_GUARD_PATH = '/tmp/nuxt-com-preview.js'

/**
 * Previews serve the production build, which never sees source edits. Editing starts `nuxt dev` next to it, once per sandbox,
 * so edits reach the page through hot module replacement.
 */
export async function startDevServer(sandbox: Sandbox) {
  // `mkdir` fails when the directory exists, so only the first of two concurrent callers starts it.
  if ((await run(sandbox, `mkdir ${DEV_STARTED} 2>/dev/null`)).exitCode !== 0) return
  try {
    await sandbox.writeFiles([
      { path: WARMUP_PATH, content: DEV_WARMUP_SCRIPT },
      { path: BRIDGE_PATH, content: PREVIEW_BRIDGE_PLUGIN },
      { path: BOOT_GUARD_PATH, content: PREVIEW_BOOT_GUARD }
    ])
    // Snapshots carry the bridge their check built with; the dev server gets the current one, which reports routes and follows navigation.
    const bridge = `PLUGINS=$([ -d app ] && echo app/plugins || echo plugins); mkdir -p $PLUGINS server/plugins && cp ${BRIDGE_PATH} $PLUGINS/ && cp ${BOOT_GUARD_PATH} server/plugins/`
    // Vite answers other hosts with "Blocked request", and `nuxt dev` loses its own allowance once a config change restarts it.
    const host = new URL(sandbox.domain(DEV_PORT)).hostname
    await sandbox.runCommand({
      cmd: 'bash',
      args: ['-c', `trap 'rm -f ${DEV_READY} ${DEV_PID}; rmdir ${DEV_STARTED}' EXIT; ${bridge}; ${DISABLE_DEVTOOLS}; export NUXT_TELEMETRY_DISABLED=1 __VITE_ADDITIONAL_SERVER_ALLOWED_HOSTS=${host}; ./node_modules/.bin/nuxt dev --port ${DEV_PORT} --public > ${DEV_LOG} 2>&1 & dev_pid=$!; echo "$dev_pid" > ${DEV_PID}; if ! node ${WARMUP_PATH} page; then kill "$dev_pid"; exit 1; fi; touch ${DEV_READY}; wait "$dev_pid"`],
      cwd: WORKDIR,
      detached: true
    })
  } catch (error) {
    await run(sandbox, `rmdir ${DEV_STARTED}`).catch(() => {})
    throw error
  }
}

/** Resolves with the dev server URL once it has bundled the app, and fails as soon as `nuxt dev` exits. */
export async function waitForDevServer(sandbox: Sandbox, onStarted?: () => void) {
  await startDevServer(sandbox)
  onStarted?.()
  const ready = await run(sandbox, `for i in $(seq 1 240); do test ! -d ${DEV_STARTED} && exit 2; test -f ${DEV_PID} && ! kill -0 "$(cat ${DEV_PID})" 2>/dev/null && exit 2; test -f ${DEV_READY} && exit 0; sleep 0.5; done; exit 1`, 130_000)
  if (ready.exitCode !== 0) {
    console.error('[templates] dev server did not start', await devServerLog(sandbox))
    throw createError({ statusCode: 504, message: 'The dev server did not start.' })
  }
  return sandbox.domain(DEV_PORT)
}

export async function devServerLog(sandbox: Sandbox) {
  return stripVTControlCharacters((await run(sandbox, `test -f ${DEV_LOG} && tail -c 32768 ${DEV_LOG} | tail -40`)).output)
}
