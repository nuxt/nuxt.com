/**
 * The shell scripts `checkTemplatesWorkflow` runs in a template's sandbox, in order: install, build, then warm `nuxt dev` for previews.
 * The workflow runs each one detached and reads its exit code and the end of its output once it finishes.
 */
import { DEV_LOG, DEV_PORT, DISABLE_DEVTOOLS } from './dev-server'
import { STATIC_SERVER_PATH } from './static-server'

/** Where each template is copied before it's installed. Live previews start from the same directory, restored from the snapshot. */
export const TEMPLATE_WORKDIR = '/vercel/app'
/** The scripts, their output and the files the check adds (preview bridge, warmup). */
export const CHECK_STATE_DIR = '/tmp/nuxt-com-check'
/** Where the run's Chromium sandbox installs Playwright. */
export const CHECK_BROWSER_DIR = '/tmp/browser'

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

/** Installs with the template's package manager and prints the Nuxt version it installed. */
export const INSTALL_SCRIPT = `${FAIL_WITH}
corepack enable >/dev/null 2>&1 || sudo corepack enable >/dev/null 2>&1 || true; PM=${PM}
export pnpm_config_strict_dep_builds=false pnpm_config_dangerously_allow_all_builds=true
timeout 600 $PM install > /tmp/install.log 2>&1 || {
  grep -q "gyp ERR" /tmp/install.log && { { sudo apt-get update -qq && sudo DEBIAN_FRONTEND=noninteractive apt-get install -y -qq build-essential python3; } || sudo dnf install -y -q python3 make gcc-c++; } > /dev/null 2>&1 && timeout 600 $PM install > /tmp/install.log 2>&1
} || fail_with "The install failed." /tmp/install.log
if node -e "process.exit(+require('./node_modules/@nuxt/content/package.json').version.split('.')[0] >= 3 ? 0 : 1)" 2>/dev/null && ! grep -q better-sqlite3 package.json && ! grep -q sqliteConnector nuxt.config.*; then $PM add better-sqlite3 >> /tmp/install.log 2>&1 || true; fi
node -p "require('nuxt/package.json').version"`

// `nuxt build` can exit 0 when a prerender promise never settles, before writing assets or the server: only Nitro's last line proves it finished.
/** Builds the template, with the preview bridge when it runs live. Prints the preview command Nitro suggests, then whether a Node server was built. */
export function buildScript(live: boolean) {
  return `${FAIL_WITH}
${live ? `PLUGINS=$([ -d app ] && echo app/plugins || echo plugins); mkdir -p $PLUGINS && cp ${CHECK_STATE_DIR}/nuxt-com-preview.client.js $PLUGINS/;` : ''} PM=${PM}
NUXT_TELEMETRY_DISABLED=1 timeout 900 $PM run build > /tmp/build.log 2>&1 || fail_with "The build failed." /tmp/build.log
test -f .output/server/index.mjs || grep -qE "(preview|deploy) this build" /tmp/build.log || fail_with "The build exited before Nitro finished." /tmp/build.log
sed -E 's/\\x1b\\[[0-9;]*m//g' /tmp/build.log | grep -oE "preview this build using .*" | tail -1 | sed -E 's/^preview this build using //; s/\`//g'
test -f .output/server/index.mjs && echo node-server || echo no-node-server`
}

/** How to start the build, from the output of `buildScript`. `undefined` for presets that only run on their platform (Cloudflare, Deno…). */
export function serveScript(buildOutput: string) {
  const lines = buildOutput.trim().split('\n')
  const hasNodeServer = lines.pop() === 'node-server'
  const preview = lines.pop()?.trim() ?? ''
  const server = preview.match(/^node (\S+\/server\/index\.mjs)$/)?.[1]
  if (server) return `exec node ${server}`
  const dir = preview.match(/^npx serve (\S+)$/)?.[1]
  if (dir) return `exec node ${STATIC_SERVER_PATH} ${dir}`
  if (hasNodeServer) return 'exec node .output/server/index.mjs'
  return undefined
}

// Bundling the dependencies of `nuxt dev` takes up to a minute on a preview's 2 vCPUs (Docus). Running it once here leaves them in
// `node_modules/.cache/vite`, with those Vite only finds at runtime, for every sandbox started from the snapshot. It runs with the
// config previews start `nuxt dev` with: Vite bundles again whenever its config differs. Its own process group stops with it.
export const WARM_DEV_SCRIPT = `${DISABLE_DEVTOOLS}
NUXT_TELEMETRY_DISABLED=1 setsid ./node_modules/.bin/nuxt dev --port ${DEV_PORT} > ${DEV_LOG} 2>&1 &
DEV=$!
timeout 300 node ${CHECK_STATE_DIR}/warmup.mjs
kill -TERM -- -$DEV 2>/dev/null; wait $DEV
rm -f ${DEV_LOG}`

/** Installs Playwright and Chromium in the run's browser sandbox. */
export const BROWSER_SETUP_SCRIPT = 'npm init -y > /dev/null && npm i playwright-core@1 > /dev/null 2>&1 && npx playwright-core install --with-deps chromium-headless-shell > /dev/null 2>&1'

// Opens a page in Chromium and prints the first message of the preview bridge: an app can serve valid HTML and still crash once it hydrates.
export const VISIT_SCRIPT = `import { chromium } from 'playwright-core'
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
